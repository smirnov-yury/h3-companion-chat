export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      abilities: {
        Row: {
          effect_empowered_en: string | null
          effect_en: string | null
          effect_expert_en: string | null
          id: string
          image_regular: string | null
          name_en: string
          name_ru: string | null
          notes_en: string | null
          notes_ru: string | null
          sort_order: number | null
        }
        Insert: {
          effect_empowered_en?: string | null
          effect_en?: string | null
          effect_expert_en?: string | null
          id: string
          image_regular?: string | null
          name_en: string
          name_ru?: string | null
          notes_en?: string | null
          notes_ru?: string | null
          sort_order?: number | null
        }
        Update: {
          effect_empowered_en?: string | null
          effect_en?: string | null
          effect_expert_en?: string | null
          id?: string
          image_regular?: string | null
          name_en?: string
          name_ru?: string | null
          notes_en?: string | null
          notes_ru?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
      artifacts: {
        Row: {
          description_en: string | null
          description_ru: string | null
          effect_en: string | null
          effect_ru: string | null
          id: string
          image: string | null
          name_en: string
          name_ru: string | null
          quality: string | null
          sort_order: number | null
        }
        Insert: {
          description_en?: string | null
          description_ru?: string | null
          effect_en?: string | null
          effect_ru?: string | null
          id: string
          image?: string | null
          name_en: string
          name_ru?: string | null
          quality?: string | null
          sort_order?: number | null
        }
        Update: {
          description_en?: string | null
          description_ru?: string | null
          effect_en?: string | null
          effect_ru?: string | null
          id?: string
          image?: string | null
          name_en?: string
          name_ru?: string | null
          quality?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
      astrologers_proclaim: {
        Row: {
          description_en: string | null
          description_ru: string | null
          effect_en: string | null
          effect_ru: string | null
          id: string
          image: string | null
          name_en: string
          name_ru: string | null
          notes_en: string | null
          notes_ru: string | null
          sort_order: number | null
        }
        Insert: {
          description_en?: string | null
          description_ru?: string | null
          effect_en?: string | null
          effect_ru?: string | null
          id: string
          image?: string | null
          name_en: string
          name_ru?: string | null
          notes_en?: string | null
          notes_ru?: string | null
          sort_order?: number | null
        }
        Update: {
          description_en?: string | null
          description_ru?: string | null
          effect_en?: string | null
          effect_ru?: string | null
          id?: string
          image?: string | null
          name_en?: string
          name_ru?: string | null
          notes_en?: string | null
          notes_ru?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          cover_image_url: string | null
          created_at: string | null
          image_url: string | null
          key: string
          label_en: string
          label_ru: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string | null
          image_url?: string | null
          key: string
          label_en: string
          label_ru: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string | null
          image_url?: string | null
          key?: string
          label_en?: string
          label_ru?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      component_types: {
        Row: {
          key: string
          label_en: string
          label_ru: string
          sort_order: number | null
        }
        Insert: {
          key: string
          label_en: string
          label_ru: string
          sort_order?: number | null
        }
        Update: {
          key?: string
          label_en?: string
          label_ru?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      components: {
        Row: {
          body_en: string | null
          body_ru: string | null
          category: string
          cover_image_url: string | null
          created_at: string | null
          faction: string | null
          id: string
          image: string | null
          media_url: string | null
          rule_id: string | null
          sort_order: number | null
          title_en: string | null
          title_ru: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          body_en?: string | null
          body_ru?: string | null
          category: string
          cover_image_url?: string | null
          created_at?: string | null
          faction?: string | null
          id?: string
          image?: string | null
          media_url?: string | null
          rule_id?: string | null
          sort_order?: number | null
          title_en?: string | null
          title_ru?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          body_en?: string | null
          body_ru?: string | null
          category?: string
          cover_image_url?: string | null
          created_at?: string | null
          faction?: string | null
          id?: string
          image?: string | null
          media_url?: string | null
          rule_id?: string | null
          sort_order?: number | null
          title_en?: string | null
          title_ru?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          effect_en: string | null
          effect_ru: string | null
          id: string
          image: string | null
          name_en: string
          name_ru: string | null
          notes_en: string | null
          notes_ru: string | null
          sort_order: number | null
        }
        Insert: {
          effect_en?: string | null
          effect_ru?: string | null
          id: string
          image?: string | null
          name_en: string
          name_ru?: string | null
          notes_en?: string | null
          notes_ru?: string | null
          sort_order?: number | null
        }
        Update: {
          effect_en?: string | null
          effect_ru?: string | null
          id?: string
          image?: string | null
          name_en?: string
          name_ru?: string | null
          notes_en?: string | null
          notes_ru?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
      fields: {
        Row: {
          effect_en: string | null
          effect_ru: string | null
          id: string
          image: string | null
          name_en: string
          name_ru: string | null
          notes_en: string | null
          notes_ru: string | null
          sort_order: number | null
          type_en: string | null
          type_ru: string | null
        }
        Insert: {
          effect_en?: string | null
          effect_ru?: string | null
          id: string
          image?: string | null
          name_en: string
          name_ru?: string | null
          notes_en?: string | null
          notes_ru?: string | null
          sort_order?: number | null
          type_en?: string | null
          type_ru?: string | null
        }
        Update: {
          effect_en?: string | null
          effect_ru?: string | null
          id?: string
          image?: string | null
          name_en?: string
          name_ru?: string | null
          notes_en?: string | null
          notes_ru?: string | null
          sort_order?: number | null
          type_en?: string | null
          type_ru?: string | null
        }
        Relationships: []
      }
      glyphs: {
        Row: {
          category: string | null
          description_en: string | null
          description_ru: string | null
          id: string
          image: string | null
          sort_order: number | null
        }
        Insert: {
          category?: string | null
          description_en?: string | null
          description_ru?: string | null
          id: string
          image?: string | null
          sort_order?: number | null
        }
        Update: {
          category?: string | null
          description_en?: string | null
          description_ru?: string | null
          id?: string
          image?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
      heroes: {
        Row: {
          ability_id: string | null
          attack: number | null
          class_en: string | null
          class_ru: string | null
          defense: number | null
          id: string
          image: string | null
          knowledge: number | null
          name_en: string
          name_ru: string | null
          notes_en: string | null
          notes_ru: string | null
          power: number | null
          sort_order: number | null
          specialty_en: string | null
          specialty_levels: Json | null
          specialty_ru: string | null
          town: string | null
        }
        Insert: {
          ability_id?: string | null
          attack?: number | null
          class_en?: string | null
          class_ru?: string | null
          defense?: number | null
          id: string
          image?: string | null
          knowledge?: number | null
          name_en: string
          name_ru?: string | null
          notes_en?: string | null
          notes_ru?: string | null
          power?: number | null
          sort_order?: number | null
          specialty_en?: string | null
          specialty_levels?: Json | null
          specialty_ru?: string | null
          town?: string | null
        }
        Update: {
          ability_id?: string | null
          attack?: number | null
          class_en?: string | null
          class_ru?: string | null
          defense?: number | null
          id?: string
          image?: string | null
          knowledge?: number | null
          name_en?: string
          name_ru?: string | null
          notes_en?: string | null
          notes_ru?: string | null
          power?: number | null
          sort_order?: number | null
          specialty_en?: string | null
          specialty_levels?: Json | null
          specialty_ru?: string | null
          town?: string | null
        }
        Relationships: []
      }
      rules: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          sort_order: number | null
          text_en: string | null
          text_ru: string | null
          title_en: string | null
          title_ru: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id: string
          sort_order?: number | null
          text_en?: string | null
          text_ru?: string | null
          title_en?: string | null
          title_ru?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          sort_order?: number | null
          text_en?: string | null
          text_ru?: string | null
          title_en?: string | null
          title_ru?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      spells: {
        Row: {
          effect_en: string | null
          effect_ru: string | null
          id: string
          image: string | null
          level: string | null
          name_en: string
          name_ru: string | null
          notes_en: string | null
          notes_ru: string | null
          school: string | null
          sort_order: number | null
        }
        Insert: {
          effect_en?: string | null
          effect_ru?: string | null
          id: string
          image?: string | null
          level?: string | null
          name_en: string
          name_ru?: string | null
          notes_en?: string | null
          notes_ru?: string | null
          school?: string | null
          sort_order?: number | null
        }
        Update: {
          effect_en?: string | null
          effect_ru?: string | null
          id?: string
          image?: string | null
          level?: string | null
          name_en?: string
          name_ru?: string | null
          notes_en?: string | null
          notes_ru?: string | null
          school?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
      town_buildings: {
        Row: {
          cost: string | null
          effect_en: string | null
          effect_ru: string | null
          id: string
          name_en: string
          name_ru: string | null
          sort_order: number | null
          town_id: string | null
        }
        Insert: {
          cost?: string | null
          effect_en?: string | null
          effect_ru?: string | null
          id: string
          name_en: string
          name_ru?: string | null
          sort_order?: number | null
          town_id?: string | null
        }
        Update: {
          cost?: string | null
          effect_en?: string | null
          effect_ru?: string | null
          id?: string
          name_en?: string
          name_ru?: string | null
          sort_order?: number | null
          town_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "town_buildings_town_id_fkey"
            columns: ["town_id"]
            isOneToOne: false
            referencedRelation: "towns"
            referencedColumns: ["id"]
          },
        ]
      }
      towns: {
        Row: {
          id: string
          image_back: string | null
          image_empty: string | null
          image_full: string | null
          name_en: string
          name_ru: string | null
          notes_en: string | null
          notes_ru: string | null
          sort_order: number | null
        }
        Insert: {
          id: string
          image_back?: string | null
          image_empty?: string | null
          image_full?: string | null
          name_en: string
          name_ru?: string | null
          notes_en?: string | null
          notes_ru?: string | null
          sort_order?: number | null
        }
        Update: {
          id?: string
          image_back?: string | null
          image_empty?: string | null
          image_full?: string | null
          name_en?: string
          name_ru?: string | null
          notes_en?: string | null
          notes_ru?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
      unit_stats: {
        Row: {
          abilities_en: string | null
          abilities_ru: string | null
          attack: number | null
          content: string | null
          cost: string | null
          defense: number | null
          health_points: number | null
          id: string
          image: string | null
          initiative: number | null
          name_en: string
          name_ru: string | null
          notes_en: string | null
          notes_ru: string | null
          number: string | null
          slug: string | null
          sort_order: number | null
          tier: string | null
          town: string | null
          type: string | null
        }
        Insert: {
          abilities_en?: string | null
          abilities_ru?: string | null
          attack?: number | null
          content?: string | null
          cost?: string | null
          defense?: number | null
          health_points?: number | null
          id: string
          image?: string | null
          initiative?: number | null
          name_en: string
          name_ru?: string | null
          notes_en?: string | null
          notes_ru?: string | null
          number?: string | null
          slug?: string | null
          sort_order?: number | null
          tier?: string | null
          town?: string | null
          type?: string | null
        }
        Update: {
          abilities_en?: string | null
          abilities_ru?: string | null
          attack?: number | null
          content?: string | null
          cost?: string | null
          defense?: number | null
          health_points?: number | null
          id?: string
          image?: string | null
          initiative?: number | null
          name_en?: string
          name_ru?: string | null
          notes_en?: string | null
          notes_ru?: string | null
          number?: string | null
          slug?: string | null
          sort_order?: number | null
          tier?: string | null
          town?: string | null
          type?: string | null
        }
        Relationships: []
      }
      war_machines: {
        Row: {
          ability_en: string | null
          ability_ru: string | null
          cost_blacksmith: string | null
          cost_trade_post: string | null
          id: string
          image: string | null
          name_en: string
          name_ru: string | null
          notes_en: string | null
          notes_ru: string | null
          sort_order: number | null
        }
        Insert: {
          ability_en?: string | null
          ability_ru?: string | null
          cost_blacksmith?: string | null
          cost_trade_post?: string | null
          id: string
          image?: string | null
          name_en: string
          name_ru?: string | null
          notes_en?: string | null
          notes_ru?: string | null
          sort_order?: number | null
        }
        Update: {
          ability_en?: string | null
          ability_ru?: string | null
          cost_blacksmith?: string | null
          cost_trade_post?: string | null
          id?: string
          image?: string | null
          name_en?: string
          name_ru?: string | null
          notes_en?: string | null
          notes_ru?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
