import {
  CanonicalModelRequest,
  CanonicalModelResponse,
  ModelProviderType,
} from "@platform/contracts";

export interface IModelProviderAdapter {
  providerType: ModelProviderType;
  isAvailable(): boolean;
  generate(req: CanonicalModelRequest, signal?: AbortSignal): Promise<CanonicalModelResponse>;
}
