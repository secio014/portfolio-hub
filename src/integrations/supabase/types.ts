export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          id?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      analytics_events: {
        Row: {
          created_at: string;
          event_type: string;
          id: string;
          page_or_project_id: string | null;
          referrer: string | null;
        };
        Insert: {
          created_at?: string;
          event_type: string;
          id?: string;
          page_or_project_id?: string | null;
          referrer?: string | null;
        };
        Update: {
          created_at?: string;
          event_type?: string;
          id?: string;
          page_or_project_id?: string | null;
          referrer?: string | null;
        };
        Relationships: [];
      };
      blog_posts: {
        Row: {
          content: Json;
          cover_media_id: string | null;
          excerpt: Json;
          id: string;
          published: boolean;
          published_at: string | null;
          slug: string;
          tags: Json;
          title: Json;
          updated_at: string;
        };
        Insert: {
          content?: Json;
          cover_media_id?: string | null;
          excerpt?: Json;
          id?: string;
          published?: boolean;
          published_at?: string | null;
          slug: string;
          tags?: Json;
          title?: Json;
          updated_at?: string;
        };
        Update: {
          content?: Json;
          cover_media_id?: string | null;
          excerpt?: Json;
          id?: string;
          published?: boolean;
          published_at?: string | null;
          slug?: string;
          tags?: Json;
          title?: Json;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "blog_posts_cover_media_id_fkey";
            columns: ["cover_media_id"];
            isOneToOne: false;
            referencedRelation: "media";
            referencedColumns: ["id"];
          },
        ];
      };
      career_timeline: {
        Row: {
          description: Json;
          end_date: string | null;
          id: string;
          institution: string;
          order: number;
          start_date: string;
          title: Json;
          type: string;
          visible: boolean;
        };
        Insert: {
          description?: Json;
          end_date?: string | null;
          id?: string;
          institution?: string;
          order?: number;
          start_date: string;
          title?: Json;
          type?: string;
          visible?: boolean;
        };
        Update: {
          description?: Json;
          end_date?: string | null;
          id?: string;
          institution?: string;
          order?: number;
          start_date?: string;
          title?: Json;
          type?: string;
          visible?: boolean;
        };
        Relationships: [];
      };
      case_studies: {
        Row: {
          approach: Json;
          content: Json;
          id: string;
          order: number;
          outcome: Json;
          problem: Json;
          project_id: string | null;
          published: boolean;
          slug: string;
          title: Json;
          updated_at: string;
        };
        Insert: {
          approach?: Json;
          content?: Json;
          id?: string;
          order?: number;
          outcome?: Json;
          problem?: Json;
          project_id?: string | null;
          published?: boolean;
          slug: string;
          title?: Json;
          updated_at?: string;
        };
        Update: {
          approach?: Json;
          content?: Json;
          id?: string;
          order?: number;
          outcome?: Json;
          problem?: Json;
          project_id?: string | null;
          published?: boolean;
          slug?: string;
          title?: Json;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "case_studies_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      certifications: {
        Row: {
          credential_url: string | null;
          date: string | null;
          id: string;
          issuer: string;
          logo_media_id: string | null;
          name: string;
          order: number;
          visible: boolean;
        };
        Insert: {
          credential_url?: string | null;
          date?: string | null;
          id?: string;
          issuer?: string;
          logo_media_id?: string | null;
          name: string;
          order?: number;
          visible?: boolean;
        };
        Update: {
          credential_url?: string | null;
          date?: string | null;
          id?: string;
          issuer?: string;
          logo_media_id?: string | null;
          name?: string;
          order?: number;
          visible?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "certifications_logo_media_id_fkey";
            columns: ["logo_media_id"];
            isOneToOne: false;
            referencedRelation: "media";
            referencedColumns: ["id"];
          },
        ];
      };
      contact_messages: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          message: string;
          name: string;
          read: boolean;
        };
        Insert: {
          created_at?: string;
          email: string;
          id?: string;
          message: string;
          name: string;
          read?: boolean;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          message?: string;
          name?: string;
          read?: boolean;
        };
        Relationships: [];
      };
      github_activity_cache: {
        Row: {
          days: Json;
          fetched_at: string;
          id: string;
          org_days: Json;
          org_total_contributions: number;
          singleton: boolean;
          total_contributions: number;
        };
        Insert: {
          days?: Json;
          fetched_at?: string;
          id?: string;
          org_days?: Json;
          org_total_contributions?: number;
          singleton?: boolean;
          total_contributions?: number;
        };
        Update: {
          days?: Json;
          fetched_at?: string;
          id?: string;
          org_days?: Json;
          org_total_contributions?: number;
          singleton?: boolean;
          total_contributions?: number;
        };
        Relationships: [];
      };
      github_repos_cache: {
        Row: {
          category: string;
          description: string | null;
          fetched_at: string;
          forks: number;
          full_name: string;
          github_repo_id: number;
          homepage: string | null;
          html_url: string;
          id: string;
          is_org: boolean;
          language: string | null;
          name: string;
          pushed_at: string | null;
          stars: number;
          topics: Json;
        };
        Insert: {
          category?: string;
          description?: string | null;
          fetched_at?: string;
          forks?: number;
          full_name: string;
          github_repo_id: number;
          homepage?: string | null;
          html_url: string;
          id?: string;
          is_org?: boolean;
          language?: string | null;
          name: string;
          pushed_at?: string | null;
          stars?: number;
          topics?: Json;
        };
        Update: {
          category?: string;
          description?: string | null;
          fetched_at?: string;
          forks?: number;
          full_name?: string;
          github_repo_id?: number;
          homepage?: string | null;
          html_url?: string;
          id?: string;
          is_org?: boolean;
          language?: string | null;
          name?: string;
          pushed_at?: string | null;
          stars?: number;
          topics?: Json;
        };
        Relationships: [];
      };
      media: {
        Row: {
          alt_text: Json;
          created_at: string;
          id: string;
          linked_section_id: string | null;
          order: number;
          type: string;
          url: string;
        };
        Insert: {
          alt_text?: Json;
          created_at?: string;
          id?: string;
          linked_section_id?: string | null;
          order?: number;
          type?: string;
          url: string;
        };
        Update: {
          alt_text?: Json;
          created_at?: string;
          id?: string;
          linked_section_id?: string | null;
          order?: number;
          type?: string;
          url?: string;
        };
        Relationships: [];
      };
      project_labels: {
        Row: {
          color: string;
          created_at: string;
          id: string;
          key: string | null;
          name: Json;
          order: number;
          updated_at: string;
        };
        Insert: {
          color?: string;
          created_at?: string;
          id?: string;
          key?: string | null;
          name?: Json;
          order?: number;
          updated_at?: string;
        };
        Update: {
          color?: string;
          created_at?: string;
          id?: string;
          key?: string | null;
          name?: Json;
          order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          cover_image_id: string | null;
          demo_url: string | null;
          description: Json;
          featured: boolean;
          github_repo_id: number | null;
          id: string;
          label_id: string | null;
          order: number;
          repo_url: string | null;
          slug: string | null;
          source: string;
          summary: Json;
          tech: Json;
          title: Json;
          updated_at: string;
          visible: boolean;
        };
        Insert: {
          cover_image_id?: string | null;
          demo_url?: string | null;
          description?: Json;
          featured?: boolean;
          github_repo_id?: number | null;
          id?: string;
          label_id?: string | null;
          order?: number;
          repo_url?: string | null;
          slug?: string | null;
          source?: string;
          summary?: Json;
          tech?: Json;
          title?: Json;
          updated_at?: string;
          visible?: boolean;
        };
        Update: {
          cover_image_id?: string | null;
          demo_url?: string | null;
          description?: Json;
          featured?: boolean;
          github_repo_id?: number | null;
          id?: string;
          label_id?: string | null;
          order?: number;
          repo_url?: string | null;
          slug?: string | null;
          source?: string;
          summary?: Json;
          tech?: Json;
          title?: Json;
          updated_at?: string;
          visible?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "projects_cover_image_id_fkey";
            columns: ["cover_image_id"];
            isOneToOne: false;
            referencedRelation: "media";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "projects_label_id_fkey";
            columns: ["label_id"];
            isOneToOne: false;
            referencedRelation: "project_labels";
            referencedColumns: ["id"];
          },
        ];
      };
      resume: {
        Row: {
          file_name: string | null;
          file_url: string | null;
          id: string;
          singleton: boolean;
          updated_at: string;
        };
        Insert: {
          file_name?: string | null;
          file_url?: string | null;
          id?: string;
          singleton?: boolean;
          updated_at?: string;
        };
        Update: {
          file_name?: string | null;
          file_url?: string | null;
          id?: string;
          singleton?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      site_labels: {
        Row: {
          created_at: string;
          enabled: boolean;
          id: string;
          order: number;
          page_slug: string;
          placement: string;
          text: Json;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          enabled?: boolean;
          id?: string;
          order?: number;
          page_slug?: string;
          placement?: string;
          text?: Json;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          enabled?: boolean;
          id?: string;
          order?: number;
          page_slug?: string;
          placement?: string;
          text?: Json;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "site_labels_page_slug_fkey";
            columns: ["page_slug"];
            isOneToOne: false;
            referencedRelation: "site_pages";
            referencedColumns: ["slug"];
          },
        ];
      };
      site_pages: {
        Row: {
          created_at: string;
          id: string;
          is_system: boolean;
          nav_visible: boolean;
          order: number;
          slug: string;
          title: Json;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_system?: boolean;
          nav_visible?: boolean;
          order?: number;
          slug: string;
          title?: Json;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_system?: boolean;
          nav_visible?: boolean;
          order?: number;
          slug?: string;
          title?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      section_blocks: {
        Row: {
          body: Json;
          created_at: string;
          id: string;
          order: number;
          section_id: string;
          title: Json;
          updated_at: string;
        };
        Insert: {
          body?: Json;
          created_at?: string;
          id?: string;
          order?: number;
          section_id: string;
          title?: Json;
          updated_at?: string;
        };
        Update: {
          body?: Json;
          created_at?: string;
          id?: string;
          order?: number;
          section_id?: string;
          title?: Json;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "section_blocks_section_id_fkey";
            columns: ["section_id"];
            isOneToOne: false;
            referencedRelation: "site_sections";
            referencedColumns: ["id"];
          },
        ];
      };
      site_sections: {
        Row: {
          body: Json;
          id: string;
          layout: string;
          order: number;
          page_slug: string;
          section_key: string;
          subtitle: Json;
          title: Json;
          type: string;
          updated_at: string;
          visible: boolean;
        };
        Insert: {
          body?: Json;
          id?: string;
          layout?: string;
          order?: number;
          page_slug?: string;
          section_key: string;
          subtitle?: Json;
          title?: Json;
          type?: string;
          updated_at?: string;
          visible?: boolean;
        };
        Update: {
          body?: Json;
          id?: string;
          layout?: string;
          order?: number;
          page_slug?: string;
          section_key?: string;
          subtitle?: Json;
          title?: Json;
          type?: string;
          updated_at?: string;
          visible?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "site_sections_page_slug_fkey";
            columns: ["page_slug"];
            isOneToOne: false;
            referencedRelation: "site_pages";
            referencedColumns: ["slug"];
          },
        ];
      };
      site_settings: {
        Row: {
          avatar_url: string | null;
          email: string | null;
          github_org: string | null;
          github_username: string | null;
          id: string;
          linkedin_badge_slug: string | null;
          linkedin_url: string | null;
          metrics: Json;
          owner_name: string;
          singleton: boolean;
          tech_stack: Json;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          email?: string | null;
          github_org?: string | null;
          github_username?: string | null;
          id?: string;
          linkedin_badge_slug?: string | null;
          linkedin_url?: string | null;
          metrics?: Json;
          owner_name?: string;
          singleton?: boolean;
          tech_stack?: Json;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          email?: string | null;
          github_org?: string | null;
          github_username?: string | null;
          id?: string;
          linkedin_badge_slug?: string | null;
          linkedin_url?: string | null;
          metrics?: Json;
          owner_name?: string;
          singleton?: boolean;
          tech_stack?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      testimonials: {
        Row: {
          author_name: string;
          author_role: Json;
          id: string;
          order: number;
          photo_media_id: string | null;
          quote: Json;
          visible: boolean;
        };
        Insert: {
          author_name: string;
          author_role?: Json;
          id?: string;
          order?: number;
          photo_media_id?: string | null;
          quote?: Json;
          visible?: boolean;
        };
        Update: {
          author_name?: string;
          author_role?: Json;
          id?: string;
          order?: number;
          photo_media_id?: string | null;
          quote?: Json;
          visible?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "testimonials_photo_media_id_fkey";
            columns: ["photo_media_id"];
            isOneToOne: false;
            referencedRelation: "media";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: { Args: { _user_id: string }; Returns: boolean };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
