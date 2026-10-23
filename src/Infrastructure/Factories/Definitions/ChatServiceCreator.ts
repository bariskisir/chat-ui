import { IChatService } from '../../../Application/Contracts/IChatService';

export type ChatServiceCreator = () => IChatService;
