import { alternateAxiosSerializer } from '@/utils';


describe('serializer', (): void => {
    it('serializes basic args properly', (): void => {
      const params = {
        'key-1': 1,
        'key-2': 'two',
        'key-3': '3',
        'key-4': true,
      };
      expect(alternateAxiosSerializer(params)).toEqual('key-1=1&key-2=two&key-3=3&key-4=true');
    });

    it('serializes list args correctly', (): void => {
      const params = {
        'key-1': [1, 2, 3, 4],
        'key-2': 'two',
      };
      expect(alternateAxiosSerializer(params)).toEqual('key-1=1&key-1=2&key-1=3&key-1=4&key-2=two');
    });
  });
