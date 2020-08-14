import Axios, { AxiosInstance } from 'axios';
import { isEqual } from 'lodash';
import {
  Assignment, Experiment, ExperimentSetup,
  Inputs, Interpreter, PlanoutCode, Namespace,
  Params, ParamValue, PlanoutEvent, PlanoutConfig,
  PlanoutExperimentConfig,
} from 'planout';
import _Vue from 'vue';

export interface PlanoutPluginOptions {
  appName: string;
  baseUrl: string;
  getConfig: () => Promise<PlanoutConfig>;
  setConfig: (config: PlanoutConfig) => void;
  logExposure: (event: PlanoutEvent) => void;
  localOverrides?: PlanoutOverrides;
}

export interface PlanoutOverride {
  variable: string;
  value: string | number | boolean;
}

export type PlanoutOverrides = { [namespace: string]: PlanoutOverride[] }

let options: PlanoutPluginOptions;

// See https://github.com/rawls238/PlanOut.js/blob/master/examples/sample_interpreter_es5.js
class InterpretedExperiment extends Experiment<Inputs, Params> {
  _script: PlanoutCode;

  _paramNames: string[];

  _config: PlanoutExperimentConfig;

  _namespace: BaseNamespace;

  constructor(namespace: BaseNamespace, experimentConfig: PlanoutExperimentConfig) {
    super({});
    this._namespace = namespace;
    this._config = experimentConfig;
    this._script = experimentConfig.compiled;
    this._paramNames = [];
    this.setName(experimentConfig.name);
    this._assignment = new Assignment(this.getSalt());
  }

  setup() {
    // Overridden to prevent base class implementation from throwing an error.
    // The name must be called here even though it is set again the constructor.
    this.setName('base');
  }

  setInputs(inputs: Inputs) {
    this.inputs = inputs;
  }

  compat() {
    // Returns a constructor that returns 'this' Experiment object instead of a new one.
    return (inputs: Inputs) => {
      this.setInputs(inputs);
      return this;
    };
  }

  assign(params: Assignment<Params>, args: Inputs): boolean {
    if (!this._inExperiment) {
      return false;
    }

    Object.assign(this.inputs, args);
    const interpreter = new Interpreter<Inputs, Params>(this._script, this.getSalt(), this.inputs);
    // Fixes https://github.com/rawls238/PlanOut.js/issues/79
    interpreter._inExperiment = true;

    const avaiableParams = interpreter.getParams();
    this._paramNames = Object.keys(avaiableParams);
    this._paramNames.forEach((name) => {
      params.set(name, avaiableParams[name]);
    });

    return interpreter.inExperiment();
  }

  configureLogger() {

  }

  log(event: PlanoutEvent) {
    if (event.event === 'exposure') {
      options.logExposure(event);
    }
  }

  getParamNames() {
    return this._paramNames;
  }

  previouslyLogged() {
    return this._exposureLogged;
  }

  peek<K extends keyof Params>(name: string, defaultValue: Params[K]): Params[K] {
    this.requireAssignment();
    return this._assignment.get(name, defaultValue) as Params[K];
  }
}

class BaseNamespace extends Namespace.SimpleNamespace<Inputs, Params> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stack!: { op: string, args: any[] }[];

  _defaultExperiment?: InterpretedExperiment;

  _defaultExperimentConfig!: PlanoutExperimentConfig;

  constructor(namespace: string) {
    super({});
    this.setName(namespace);
  }

  setupDefaults() {
    this.numSegments = 1000;
    this.stack = [];
  }

  setup() {
    // Overridden to prevent base class implementation from throwing an error.
    // The name must be called here even though it is set again the constructor.
    this.setName('base');
  }

  setupExperiments() {
    // Overridden to prevent base class implementation from throwing an error.
    // Experiments are added dynamically using compiled Planout language code.
  }

  setOverride(experimentName: string, name: string, value: ParamValue) {
    this.stack.push({ op: 'setOverride', args: [experimentName, name, value] });
    if (this.currentExperiments[experimentName]) {
      this._assignExperimentObject(experimentName);
      if (value !== undefined && this._experiment) {
        this._experiment.addOverride(name, value as string);
      }
    }
  }

  requireAssignment() {
    this.requireExperiment();
    let experiment = this._experiment;
    if (!this._experiment) {
      this.requireDefaultExperiment();
      experiment = this._defaultExperiment;
    }
    experiment!.requireAssignment();
    return experiment!;
  }

  getParamNames() {
    const experiment = this.requireAssignment();
    return experiment!.getParamNames();
  }

  addExperimentConfig(experimentConfig: PlanoutExperimentConfig) {
    this.stack.push({ op: 'addExperimentConfig', args: [experimentConfig] });
    const experiment = new InterpretedExperiment(this, experimentConfig);
    const compat = experiment.compat();
    return super.addExperiment(experimentConfig.name, compat, experimentConfig.num_segments);
  }

  setDefaultExperimentConfig(experimentConfig: PlanoutExperimentConfig) {
    this._defaultExperimentConfig = Object.assign({}, experimentConfig);
  }

  _assignDefaultExperiment() {
    this._defaultExperiment = new InterpretedExperiment(this, this._defaultExperimentConfig);
    this._defaultExperiment.setInputs(this.inputs);
    this._defaultExperiment.setAutoExposureLogging(false);
  }

  removeExperiment(name: string) {
    this.stack.push({ op: 'removeExperiment', args: [name] });
    return super.removeExperiment(name);
  }

  clone() {
    const ns = new BaseNamespace(this.getName());
    ns._defaultExperimentConfig = this._defaultExperimentConfig;
    ns.numSegments = this.numSegments;
    ns.setPrimaryUnit(this.getPrimaryUnit());
    this.stack.forEach((nsOp) => {
      ns[nsOp.op].apply(ns, nsOp.args);
    });
    return ns;
  }
}

export class PlanoutPlugin {
  inputs: { [key: string]: ParamValue } = {};

  namespaces: { [key: string]: BaseNamespace } = {};

  _axios: AxiosInstance | undefined;

  get axios(): AxiosInstance {
    if (!this._axios) {
      this._axios = Axios.create({
        baseURL: options.baseUrl,
        timeout: 30 * 1000, // Timeout
      });
    }
    return this._axios;
  }

  get<K extends keyof Params>(namespace: string, key: string, defaultValue?: Params[K]): Params[K] {
    const ns = this.namespaces[namespace];
    return ns ? ns.get(key, defaultValue) : defaultValue;
  }

  peek<K extends keyof Params>(namespace: string, key: string, defaultValue?: Params[K]): Params[K] {
    const experiment = this.getExperiment(namespace);
    return experiment ? experiment.peek(key, defaultValue) : defaultValue;
  }

  getExperiment(namespace: string): InterpretedExperiment | undefined {
    const ns = this.namespaces[namespace];
    if (ns) {
      return ns.requireAssignment() as InterpretedExperiment;
    }
  }

  getParamNames(namespace: string): string[] {
    const ns = this.namespaces[namespace];
    if (ns) {
      return ns.getParamNames();
    }
    return [];
  }

  getParams(namespace: string) {
    const result = {};
    this.getParamNames(namespace).forEach((name) => {
      const value = this.get(namespace, name);
      if (value !== undefined) {
        result[name] = this.get(namespace, name);
      }
    });
    return result;
  }

  resetNamespaces() {
    this.namespaces = {};
  }

  setOptions(_options: PlanoutPluginOptions) {
    options = _options;
  }

  setInput(key: string, value: ParamValue) {
    if (this.inputs[key] !== value) {
      this.inputs[key] = value;
      ExperimentSetup.registerExperimentInput(key, value);
      Object.keys(this.namespaces).forEach((namespaceName: string) => {
        const ns = this.namespaces[namespaceName];
        this.namespaces[namespaceName] = ns.clone();
      });
    }
  }

  addNamespace(namespace: string, numSegments: number = 1000, primaryUnit: string = 'uid', compiled?: PlanoutCode) {
    if (!this.namespaces[namespace]) {
      const ns = new BaseNamespace(namespace);
      this.namespaces[namespace] = ns;
      ns.setName(namespace);
      ns.numSegments = numSegments;
      ns.setPrimaryUnit(primaryUnit);
      ns.setDefaultExperimentConfig({
        namespace_name: namespace,
        name: '_default',
        compiled: compiled || { op: 'seq', seq: [] },
        num_segments: 0,
      });
    }
    return this.namespaces[namespace];
  }

  add(experimentConfig: PlanoutExperimentConfig) {
    const namespace = experimentConfig.namespace_name;
    if (!this.namespaces[namespace]) {
      this.addNamespace(namespace);
    }
    this.namespaces[namespace].addExperimentConfig(experimentConfig);
  }

  remove(namespace: string, name: string) {
    if (this.namespaces[namespace]) {
      this.namespaces[namespace].removeExperiment(name);
    }
  }

  useConfig(config: PlanoutConfig) {
    this.resetNamespaces();
    config.namespaces.forEach((nsConfig) => {
      this.addNamespace(
        nsConfig.name,
        nsConfig.num_segments,
        nsConfig.primary_unit,
        nsConfig.compiled);
    });

    config.experiments.forEach((nsOp) => {
      const experiment = nsOp.experiment;
      if (nsOp.op === 'add') {
        this.add(experiment);
      } else if (nsOp.op === 'remove') {
        this.remove(experiment.namespace_name, experiment.name);
      } else {
        console.error(`Unknown operation ${nsOp.op}.`);
      }
    });

    if (options.localOverrides) {
      Object.keys(options.localOverrides).forEach((namespace: string) => {
        const nsOverrides = options.localOverrides![namespace];
        const ns = this.namespaces[namespace] || this.addNamespace(namespace);
        nsOverrides.forEach((override) => {
          ns.setOverride('default', override.variable, override.value);
        });
      });
    }
  }

  async fetchConfig() {
    try {
      const response = await this.axios.get<PlanoutConfig>(`/cms/planout/config/${options.appName}`);
      const config = await options.getConfig();
      if (!isEqual(response.data, config)) {
        console.info('Planout: Experiment config updated. Re-initializing.');
        options.setConfig(response.data);
        this.useConfig(response.data);
      } else {
        console.info('Planout: Experiment config unchanged.');
      }
    } catch (error) {
      console.error(error);
    }
  }
}

export const planout = new PlanoutPlugin();

export default (Vue: typeof _Vue, options: PlanoutPluginOptions): void => {
  planout.setOptions(options);

  Object.defineProperties(Vue.prototype, {
    $planout: {
      get() {
        return planout;
      },
    },
  });
};
