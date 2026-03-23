import type { BPMNNodeType } from "../../../types";
import { StartEventNode } from "./start-event-node";
import { EndEventNode } from "./end-event-node";
import { ServiceTaskNode } from "./service-task-node";
import { UserTaskNode } from "./user-task-node";
import { ExclusiveGatewayNode } from "./exclusive-gateway-node";
import { ParallelGatewayNode } from "./parallel-gateway-node";
import { TimerEventNode } from "./timer-event-node";
import { ErrorEventNode } from "./error-event-node";

export const nodeTypes: Record<BPMNNodeType, React.ComponentType<any>> = {
  startEvent: StartEventNode,
  endEvent: EndEventNode,
  serviceTask: ServiceTaskNode,
  userTask: UserTaskNode,
  exclusiveGateway: ExclusiveGatewayNode,
  parallelGateway: ParallelGatewayNode,
  timerEvent: TimerEventNode,
  errorEvent: ErrorEventNode,
};

export {
  StartEventNode,
  EndEventNode,
  ServiceTaskNode,
  UserTaskNode,
  ExclusiveGatewayNode,
  ParallelGatewayNode,
  TimerEventNode,
  ErrorEventNode,
};
