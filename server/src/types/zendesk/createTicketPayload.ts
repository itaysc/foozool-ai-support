export interface ICreateTicketPayload {
    ticket: {
      comment: {
        author_id?: number;
        body: string;
        html_body?: string;
        public?: boolean;
        uploads?: string[];
        via?: Record<string, unknown>;
      };
      additional_collaborators?: {
        email: string;
        name: string;
      }[];
      assignee_email?: string;
      assignee_id?: number;
      attribute_value_ids?: number[];
      collaborator_ids?: number[];
      custom_fields?: {
        key: string;
        type?: string;
        title?: string;
        active?: boolean;
        custom_field_options?: {
          name: string;
          value: string;
          position?: number;
        }[];
        description?: string;
        position?: number;
        raw_description?: string;
        raw_title?: string;
        regexp_for_validation?: string;
        relationship_filter?: Record<string, unknown>;
        relationship_target_type?: string;
        tag?: string;
      }[];
      custom_status_id?: number;
      due_at?: string; // ISO 8601 date-time string
      email_ccs?: {
        action: "put" | "delete";
        user_email: string;
        user_id: string;
        user_name?: string;
      }[];
      external_id?: string;
      followers?: {
        action: "put" | "delete";
        user_email: string;
        user_id: string;
      }[];
      group_id?: number;
      organization_id?: number;
      priority?: "urgent" | "high" | "normal" | "low";
      problem_id?: number;
      requester_id?: number;
      safe_update?: boolean;
      sharing_agreement_ids?: number[];
      status?: "new" | "open" | "pending" | "hold" | "solved" | "closed";
      subject?: string;
      tags?: string[];
      type?: "problem" | "incident" | "question" | "task";
      updated_stamp?: string; // ISO 8601 date-time string
      brand_id?: number;
      collaborators?: {
        email: string;
        name: string;
      }[];
      email_cc_ids?: number[];
      follower_ids?: number[];
      macro_ids?: number[];
      raw_subject?: string;
      recipient?: string;
      submitter_id?: number;
      ticket_form_id?: number;
      via_followup_source_id?: number;
    };
  }
  