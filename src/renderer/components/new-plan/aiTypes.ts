// import { BlockDefinition, Plan } from '@kapeta/schemas';

// export type PlanContext = {
//     plan: Plan;
//     blocks: BlockDefinition[];
// };

// export type PromptResult = {
//     explanation: string;
//     context: PlanContext;
//     threadId: string;
// };

// export interface APIResponse {
//     answer: string;
//     threadid: string;
// }

export interface AIChatMessage {
    role: 'user' | 'assistant';
    content: string;
    threadId?: string;
}
