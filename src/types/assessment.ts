export type AssessmentRow = {
  title: string;
  criteria: string;
  maxPoints: string | number;
  scoreChange?: string;
};

export type Option = { label: string; value: string };

export type FieldSchema =
  | { type: "input"; name: string; label: string; placeholder?: string; disabled?: boolean }
  | { type: "select"; name: string; label: string; options: Option[]; placeholder?: string; disabled?: boolean }
  | { type: "textarea"; name: string; label: string; placeholder?: string; disabled?: boolean }
  | { type: "year"; name: string; label: string; options: Option[] }
  | { type: "chips"; name: string; label: string; items: string[] }
  | { type: "files"; name: string; label: string; files: { name: string; url: string }[] };

export type ModalSchema = {
  key: string;
  title: string;
  mode: "view" | "apply";
  fields: FieldSchema[];
};

export type AssessmentPageConfig = {
  title: string;
  rows: AssessmentRow[];
  actions: { label: string; modalKey: string; variant?: "primary" | "success" | "danger" }[];
  modalSchemas: ModalSchema[];
};
