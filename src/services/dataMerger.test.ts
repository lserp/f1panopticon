import { describe, it, expect, beforeEach } from 'vitest';
import { DataMerger } from './dataMerger';

describe('DataMerger', () => {
  let dataMerger: DataMerger;

  beforeEach(() => {
    dataMerger = new DataMerger();
  });

  it('should create a DataMerger instance', () => {
    expect(dataMerger).toBeDefined();
  });

  it('should provide access to Ergast API', () => {
    const ergastApi = dataMerger.getErgastApi();
    expect(ergastApi).toBeDefined();
  });

  it('should provide access to OpenF1 API', () => {
    const openf1Api = dataMerger.getOpenF1Api();
    expect(openf1Api).toBeDefined();
  });
});
