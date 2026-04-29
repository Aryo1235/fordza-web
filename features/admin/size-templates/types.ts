export interface SizeTemplate {
  id: string;
  name: string;
  type: string;
  sizes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SizeTemplateCreateInput {
  name: string;
  type: string;
  sizes: string[];
}
