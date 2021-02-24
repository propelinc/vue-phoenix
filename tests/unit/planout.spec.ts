import { createLocalVue } from '@vue/test-utils';
import { PlanoutCode } from 'planout';

import PlanoutVuePlugin, { BaseNamespace, PlanoutPlugin } from '@/plugins/planout';

const defaultScript: PlanoutCode = {
  op: 'seq',
  seq: [
    {
      op: 'set',
      var: 'variable1',
      value: 'ns-default',
    },
  ],
};

describe('Vue plugin and vuex module tests', (): void => {
  const localVue = createLocalVue();
  const axiosGetMock = jest.fn();

  beforeEach(() => {
    localVue.use(PlanoutVuePlugin, {
      appName: 'dummy',
      baseUrl: 'dummy.com',
      logExposure: jest.fn(),
    });
  });

  // TODO(ram): Make test wait for config load.
  xit('adds a $planout method to the Vue prototype', async () => {
    axiosGetMock.mockReturnValueOnce({ namespaces: [], experiments: [] });
    localVue.use(PlanoutVuePlugin);
    expect(typeof localVue.prototype.$planout).toBe('object');
  });
});

describe('BaseNamespace tests', (): void => {
  it('Default numSegments to 1000', () => {
    const ns = new BaseNamespace('test');
    expect(ns.numSegments).toEqual(1000);

    expect(ns.availableSegments[0]).toEqual(0);
    expect(ns.availableSegments[999]).toEqual(999);
    expect(ns.availableSegments).toEqual([...ns.availableSegments].sort((a, b) => a-b))
    expect(ns.availableSegments.length).toEqual(1000);
  });
  it('can override numSegments', () => {
    const ns = new BaseNamespace('test', 5);
    expect(ns.numSegments).toEqual(5);

    expect(ns.availableSegments[0]).toEqual(0);
    expect(ns.availableSegments[4]).toEqual(4);
    expect(ns.availableSegments).toEqual([...ns.availableSegments].sort((a, b) => a-b))
    expect(ns.availableSegments.length).toEqual(5);
  });
});

describe('Experiment assignment tests', (): void => {
  let planout: PlanoutPlugin;

  const simpleScript: PlanoutCode = {
    op: 'seq',
    seq: [
      {
        op: 'set',
        var: 'variable1',
        value: {
          op: 'uniformChoice',
          choices: ['goku', 'vegeta'],
          unit: {
            op: 'get',
            var: 'uid',
          },
        },
      },
    ],
  };

  const simpleScript2: PlanoutCode = {
    op: 'seq',
    seq: [
      {
        op: 'set',
        var: 'variable1',
        value: {
          op: 'uniformChoice',
          choices: ['frieza', 'cell'],
          unit: {
            op: 'get',
            var: 'uid',
          },
        },
      },
    ],
  };

  const addExperiment = (namespace: string, name: string, numSegments: number, compiled: PlanoutCode) => {
    planout.add({
      namespace_name: namespace,
      name: name,
      num_segments: numSegments,
      compiled: compiled,
    });
  };

  let exposures: number;
  const logExposure = () => {
    exposures += 1;
  };

  beforeEach(() => {
    exposures = 0;
    planout = new PlanoutPlugin();
    planout.setOptions({
      appName: 'dummy',
      baseUrl: 'dummy.com',
      logExposure,
    });
  });

  it('can run an experiment on all segments', (): void => {
    addExperiment('ns1', 'exp1', 1000, simpleScript);

    planout.setInput('uid', '1');
    const value = planout.get('ns1', 'variable1', 'gohan');
    expect(value).not.toEqual('gohan');
    expect(['goku', 'vegeta']).toContain(value);
    expect(exposures).toEqual(1);

    const counts: { [key: string]: number } = {};
    for (let i = 0; i < 100; i++) {
      planout.setInput('uid', i.toString());
      const value = planout.get('ns1', 'variable1', 'gohan');
      if (!counts[value as string]) {
        counts[value as string] = 0;
      }
      counts[value as string] += 1;
    }
    expect(counts.goku).toBeGreaterThan(45);
    expect(counts.vegeta).toBeGreaterThan(45);
    expect(counts.goku + counts.vegeta).toEqual(100);

    const value2 = planout.get('ns1', 'variable2', 'gohan');
    expect(value2).toEqual('gohan');
    expect(exposures).toEqual(101);
  });

  it('can run an experiment on half the segments', (): void => {
    const counts: { [key: string]: number } = {};
    for (let i = 0; i < 100; i++) {
      addExperiment('ns2', 'exp2', 500, simpleScript);
      planout.setInput('uid', i.toString());
      const value = planout.get('ns2', 'variable1', 'gohan');
      if (!counts[value as string]) {
        counts[value as string] = 0;
      }
      counts[value as string] += 1;
    }
    expect(counts.goku).toBeGreaterThan(18);
    expect(counts.vegeta).toBeGreaterThan(18);
    expect(counts.goku + counts.vegeta).toBeLessThan(60);
    expect(counts.goku + counts.vegeta + counts.gohan).toEqual(100);
    expect(exposures).toBeLessThan(60);
  });

  it('can run mutually exclusive experiments', (): void => {
    addExperiment('ns3', 'exp1', 500, simpleScript);
    addExperiment('ns3', 'exp2', 500, simpleScript2);

    const counts: { [key: string]: number } = {};
    for (let i = 0; i < 100; i++) {
      planout.setInput('uid', i.toString());
      const value = planout.get('ns3', 'variable1', 'gohan');
      if (!counts[value as string]) {
        counts[value as string] = 0;
      }
      counts[value as string] += 1;
    }

    expect(counts.goku).toBeGreaterThan(18);
    expect(counts.vegeta).toBeGreaterThan(18);
    expect(counts.frieza).toBeGreaterThan(18);
    expect(counts.cell).toBeGreaterThan(18);
    expect(counts.goku + counts.vegeta + counts.frieza + counts.cell).toEqual(100);
    expect(exposures).toEqual(100);
  });

  it('can remove an experiment', (): void => {
    addExperiment('ns3', 'exp1', 500, simpleScript);
    addExperiment('ns3', 'exp2', 500, simpleScript2);
    planout.remove('ns3', 'exp2');

    const counts: { [key: string]: number } = {};
    for (let i = 0; i < 100; i++) {
      planout.setInput('uid', i.toString());
      const value = planout.get('ns3', 'variable1', 'gohan');
      if (!counts[value as string]) {
        counts[value as string] = 0;
      }
      counts[value as string] += 1;
    }

    expect(counts.goku).toBeGreaterThan(18);
    expect(counts.vegeta).toBeGreaterThan(18);
    expect(counts.frieza).toEqual(undefined);
    expect(counts.cell).toEqual(undefined);
    expect(counts.gohan + counts.goku + counts.vegeta).toEqual(100);
    expect(exposures).toBeLessThan(60);
  });

  it('can run a default experiment', (): void => {
    planout.addNamespace('ns1', 1000, 'uid', defaultScript);

    const value = planout.get('ns1', 'variable1', 'gohan');
    expect(value).toEqual('ns-default');
    expect(exposures).toEqual(0);
  });

  it('can peek at a value', (): void => {
    planout.addNamespace('ns1', 1000, 'uid', defaultScript);

    let value = planout.peek('ns1', 'variable1', 'gohan');
    expect(value).toEqual('ns-default');
    expect(exposures).toEqual(0);

    planout.addNamespace('ns1', 1000, 'uid', defaultScript);
    addExperiment('ns1', 'exp1', 1000, simpleScript);
    planout.setInput('uid', '1');

    value = planout.peek('ns1', 'variable1', 'gohan');
    expect(['goku', 'vegeta']).toContain(value);
    expect(exposures).toEqual(0);

    value = planout.get('ns1', 'variable1', 'gohan');
    expect(['goku', 'vegeta']).toContain(value);
    expect(exposures).toEqual(1);
  });
});
