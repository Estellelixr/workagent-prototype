export type Role = 'user' | 'admin';
export type ActiveSpace = 'workbench' | 'admin';
export const AGENT_CATEGORY_OPTIONS = ['法律', '金融', '办公', '电商', '医疗', '编程', '数据'] as const;
export type AgentCategory = typeof AGENT_CATEGORY_OPTIONS[number];

export type AdminSection =
  | 'users-orgs'
  | 'material-library'
  | 'model-management'
  | 'agent-management'
  | 'ai-resources'
  | 'writing-admin'
  | 'security-policy'
  | 'audit'
  | 'system-settings';

export type AdminSubSection =
  | 'users'
  | 'org-tree'
  | 'agents'
  | 'connectors'
  | 'style-library'
  | 'business-management'
  | 'red-templates'
  | 'material-documents'
  | 'document-type-management'
  | 'metadata-management'
  | 'tag-management'
  | 'llm-models'
  | 'embedding-models'
  | 'rerank-models'
  | 'agent-directory'
  | 'role-management'
  | 'menu-management'
  | 'appearance-management';

export interface Agent {
  id: string;
  name: string;
  avatar: string;
  type: 'my' | 'general' | 'expert' | 'dept' | 'market';
  category?: AgentCategory;
  domain?: 'legal' | 'doc' | 'finance' | 'purchase';
  description: string;
  connectedSystem: string[];
  recommendReason?: string;
  isCustom?: boolean;
  isEnabled?: boolean;
}

export interface Connector {
  id: string;
  name: string;
  icon: string;
  purpose: string;
  status: 'connected' | 'pending' | 'disconnected';
  syncTime: string;
  dataReadPermission: string;
  category?: string;
  metrics?: string;
  developer?: string;
}

export interface DocumentInfo {
  id: string;
  title: string;
  lastModified: string;
  author: string;
  type: 'recent' | 'template';
  category?: '公文' | '报送' | '合同';
  content?: string;
}

export interface AuditLogItem {
  id: string;
  operator: string;
  agentName: string;
  permissionUsed: string;
  node: string;
  dataAccessed: string;
  nationalCryptHash: string;
  timestamp: string;
}

export interface SkillItem {
  id: string;
  name: string;
  description: string;
  category: string;
  mountedAgentsCount: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  content: string;
  timestamp: string;
  systemRef?: string;
}

export interface ChatHistory {
  id: string;
  agentId: string;
  agentName: string;
  agentAvatar: string;
  title: string;
  lastMessage: string;
  timestamp: string;
}
