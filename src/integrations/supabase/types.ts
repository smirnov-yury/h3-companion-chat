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
          effect_empowered_ru: string | null
          effect_en: string | null
          effect_expert_en: string | null
          effect_expert_ru: string | null
          effect_ru: string | null
          embedding_en: string | null
          embedding_ru: string | null
          id: string
          image_regular: string | null
          name_en: string
          name_ru: string | null
          notes_en: string | null
          notes_ru: string | null
          search_text_en: string | null
          search_text_ru: string | null
          sort_order: number | null
        }
        Insert: {
          effect_empowered_en?: string | null
          effect_empowered_ru?: string | null
          effect_en?: string | null
          effect_expert_en?: string | null
          effect_expert_ru?: string | null
          effect_ru?: string | null
          embedding_en?: string | null
          embedding_ru?: string | null
          id: string
          image_regular?: string | null
          name_en: string
          name_ru?: string | null
          notes_en?: string | null
          notes_ru?: string | null
          search_text_en?: string | null
          search_text_ru?: string | null
          sort_order?: number | null
        }
        Update: {
          effect_empowered_en?: string | null
          effect_empowered_ru?: string | null
          effect_en?: string | null
          effect_expert_en?: string | null
          effect_expert_ru?: string | null
          effect_ru?: string | null
          embedding_en?: string | null
          embedding_ru?: string | null
          id?: string
          image_regular?: string | null
          name_en?: string
          name_ru?: string | null
          notes_en?: string | null
          notes_ru?: string | null
          search_text_en?: string | null
          search_text_ru?: string | null
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
          embedding_en: string | null
          embedding_ru: string | null
          id: string
          image: string | null
          name_en: string
          name_ru: string | null
          quality: string | null
          search_text_en: string | null
          search_text_ru: string | null
          sort_order: number | null
        }
        Insert: {
          description_en?: string | null
          description_ru?: string | null
          effect_en?: string | null
          effect_ru?: string | null
          embedding_en?: string | null
          embedding_ru?: string | null
          id: string
          image?: string | null
          name_en: string
          name_ru?: string | null
          quality?: string | null
          search_text_en?: string | null
          search_text_ru?: string | null
          sort_order?: number | null
        }
        Update: {
          description_en?: string | null
          description_ru?: string | null
          effect_en?: string | null
          effect_ru?: string | null
          embedding_en?: string | null
          embedding_ru?: string | null
          id?: string
          image?: string | null
          name_en?: string
          name_ru?: string | null
          quality?: string | null
          search_text_en?: string | null
          search_text_ru?: string | null
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
          embedding_en: string | null
          embedding_ru: string | null
          id: string
          image: string | null
          name_en: string
          name_ru: string | null
          notes_en: string | null
          notes_ru: string | null
          search_text_en: string | null
          search_text_ru: string | null
          sort_order: number | null
        }
        Insert: {
          description_en?: string | null
          description_ru?: string | null
          effect_en?: string | null
          effect_ru?: string | null
          embedding_en?: string | null
          embedding_ru?: string | null
          id: string
          image?: string | null
          name_en: string
          name_ru?: string | null
          notes_en?: string | null
          notes_ru?: string | null
          search_text_en?: string | null
          search_text_ru?: string | null
          sort_order?: number | null
        }
        Update: {
          description_en?: string | null
          description_ru?: string | null
          effect_en?: string | null
          effect_ru?: string | null
          embedding_en?: string | null
          embedding_ru?: string | null
          id?: string
          image?: string | null
          name_en?: string
          name_ru?: string | null
          notes_en?: string | null
          notes_ru?: string | null
          search_text_en?: string | null
          search_text_ru?: string | null
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
      entity_links: {
        Row: {
          context_text: string | null
          from_id: string
          from_type: string
          id: number
          link_type: string
          sort_order: number | null
          to_id: string
          to_type: string
        }
        Insert: {
          context_text?: string | null
          from_id: string
          from_type: string
          id?: number
          link_type: string
          sort_order?: number | null
          to_id: string
          to_type: string
        }
        Update: {
          context_text?: string | null
          from_id?: string
          from_type?: string
          id?: number
          link_type?: string
          sort_order?: number | null
          to_id?: string
          to_type?: string
        }
        Relationships: []
      }
      entity_tags: {
        Row: {
          entity_id: string
          entity_type: string
          tag_id: string
        }
        Insert: {
          entity_id: string
          entity_type: string
          tag_id: string
        }
        Update: {
          entity_id?: string
          entity_type?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          effect_en: string | null
          effect_ru: string | null
          embedding_en: string | null
          embedding_ru: string | null
          id: string
          image: string | null
          name_en: string
          name_ru: string | null
          notes_en: string | null
          notes_ru: string | null
          search_text_en: string | null
          search_text_ru: string | null
          sort_order: number | null
        }
        Insert: {
          effect_en?: string | null
          effect_ru?: string | null
          embedding_en?: string | null
          embedding_ru?: string | null
          id: string
          image?: string | null
          name_en: string
          name_ru?: string | null
          notes_en?: string | null
          notes_ru?: string | null
          search_text_en?: string | null
          search_text_ru?: string | null
          sort_order?: number | null
        }
        Update: {
          effect_en?: string | null
          effect_ru?: string | null
          embedding_en?: string | null
          embedding_ru?: string | null
          id?: string
          image?: string | null
          name_en?: string
          name_ru?: string | null
          notes_en?: string | null
          notes_ru?: string | null
          search_text_en?: string | null
          search_text_ru?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
      fields: {
        Row: {
          effect_en: string | null
          effect_ru: string | null
          embedding_en: string | null
          embedding_ru: string | null
          id: string
          image: string | null
          name_en: string
          name_ru: string | null
          notes_en: string | null
          notes_ru: string | null
          search_text_en: string | null
          search_text_ru: string | null
          sort_order: number | null
          type_en: string | null
          type_ru: string | null
        }
        Insert: {
          effect_en?: string | null
          effect_ru?: string | null
          embedding_en?: string | null
          embedding_ru?: string | null
          id: string
          image?: string | null
          name_en: string
          name_ru?: string | null
          notes_en?: string | null
          notes_ru?: string | null
          search_text_en?: string | null
          search_text_ru?: string | null
          sort_order?: number | null
          type_en?: string | null
          type_ru?: string | null
        }
        Update: {
          effect_en?: string | null
          effect_ru?: string | null
          embedding_en?: string | null
          embedding_ru?: string | null
          id?: string
          image?: string | null
          name_en?: string
          name_ru?: string | null
          notes_en?: string | null
          notes_ru?: string | null
          search_text_en?: string | null
          search_text_ru?: string | null
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
          embedding_en: string | null
          embedding_ru: string | null
          id: string
          image: string | null
          search_text_en: string | null
          search_text_ru: string | null
          sort_order: number | null
        }
        Insert: {
          category?: string | null
          description_en?: string | null
          description_ru?: string | null
          embedding_en?: string | null
          embedding_ru?: string | null
          id: string
          image?: string | null
          search_text_en?: string | null
          search_text_ru?: string | null
          sort_order?: number | null
        }
        Update: {
          category?: string | null
          description_en?: string | null
          description_ru?: string | null
          embedding_en?: string | null
          embedding_ru?: string | null
          id?: string
          image?: string | null
          search_text_en?: string | null
          search_text_ru?: string | null
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
          embedding_en: string | null
          embedding_ru: string | null
          id: string
          image: string | null
          knowledge: number | null
          name_en: string
          name_ru: string | null
          notes_en: string | null
          notes_ru: string | null
          power: number | null
          search_text_en: string | null
          search_text_ru: string | null
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
          embedding_en?: string | null
          embedding_ru?: string | null
          id: string
          image?: string | null
          knowledge?: number | null
          name_en: string
          name_ru?: string | null
          notes_en?: string | null
          notes_ru?: string | null
          power?: number | null
          search_text_en?: string | null
          search_text_ru?: string | null
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
          embedding_en?: string | null
          embedding_ru?: string | null
          id?: string
          image?: string | null
          knowledge?: number | null
          name_en?: string
          name_ru?: string | null
          notes_en?: string | null
          notes_ru?: string | null
          power?: number | null
          search_text_en?: string | null
          search_text_ru?: string | null
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
          embedding_en: string | null
          embedding_ru: string | null
          id: string
          search_text_en: string | null
          search_text_ru: string | null
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
          embedding_en?: string | null
          embedding_ru?: string | null
          id: string
          search_text_en?: string | null
          search_text_ru?: string | null
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
          embedding_en?: string | null
          embedding_ru?: string | null
          id?: string
          search_text_en?: string | null
          search_text_ru?: string | null
          sort_order?: number | null
          text_en?: string | null
          text_ru?: string | null
          title_en?: string | null
          title_ru?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      scenario_ai_setup: {
        Row: {
          ai_faction_en: string | null
          ai_faction_ru: string | null
          enemy_armies_en: Json | null
          enemy_armies_ru: Json | null
          enemy_decks_en: Json | null
          enemy_decks_ru: Json | null
          enemy_heroes_en: Json | null
          enemy_heroes_ru: Json | null
          enemy_spell_deck_en: Json | null
          enemy_spell_deck_ru: Json | null
          id: number
          notes_en: string | null
          notes_ru: string | null
          scenario_id: string
          special_setup_en: string | null
          special_setup_ru: string | null
        }
        Insert: {
          ai_faction_en?: string | null
          ai_faction_ru?: string | null
          enemy_armies_en?: Json | null
          enemy_armies_ru?: Json | null
          enemy_decks_en?: Json | null
          enemy_decks_ru?: Json | null
          enemy_heroes_en?: Json | null
          enemy_heroes_ru?: Json | null
          enemy_spell_deck_en?: Json | null
          enemy_spell_deck_ru?: Json | null
          id?: number
          notes_en?: string | null
          notes_ru?: string | null
          scenario_id: string
          special_setup_en?: string | null
          special_setup_ru?: string | null
        }
        Update: {
          ai_faction_en?: string | null
          ai_faction_ru?: string | null
          enemy_armies_en?: Json | null
          enemy_armies_ru?: Json | null
          enemy_decks_en?: Json | null
          enemy_decks_ru?: Json | null
          enemy_heroes_en?: Json | null
          enemy_heroes_ru?: Json | null
          enemy_spell_deck_en?: Json | null
          enemy_spell_deck_ru?: Json | null
          id?: number
          notes_en?: string | null
          notes_ru?: string | null
          scenario_id?: string
          special_setup_en?: string | null
          special_setup_ru?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scenario_ai_setup_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: true
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      scenario_books: {
        Row: {
          created_at: string
          id: string
          is_expansion: boolean
          notes_en: string | null
          notes_ru: string | null
          release_order: number
          slug: string
          source_file_name: string | null
          source_type: string
          title_en: string
          title_ru: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          is_expansion?: boolean
          notes_en?: string | null
          notes_ru?: string | null
          release_order?: number
          slug: string
          source_file_name?: string | null
          source_type?: string
          title_en: string
          title_ru?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_expansion?: boolean
          notes_en?: string | null
          notes_ru?: string | null
          release_order?: number
          slug?: string
          source_file_name?: string | null
          source_type?: string
          title_en?: string
          title_ru?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      scenario_map_variants: {
        Row: {
          id: number
          layout_notes_en: string | null
          layout_notes_ru: string | null
          layout_schema: Json | null
          map_image: string | null
          map_setup_text_en: string | null
          map_setup_text_ru: string | null
          player_count: number
          scenario_id: string
          sort_order: number
          source_page: number | null
          tile_counts: Json
          variant_label_en: string | null
          variant_label_ru: string | null
        }
        Insert: {
          id?: number
          layout_notes_en?: string | null
          layout_notes_ru?: string | null
          layout_schema?: Json | null
          map_image?: string | null
          map_setup_text_en?: string | null
          map_setup_text_ru?: string | null
          player_count: number
          scenario_id: string
          sort_order?: number
          source_page?: number | null
          tile_counts?: Json
          variant_label_en?: string | null
          variant_label_ru?: string | null
        }
        Update: {
          id?: number
          layout_notes_en?: string | null
          layout_notes_ru?: string | null
          layout_schema?: Json | null
          map_image?: string | null
          map_setup_text_en?: string | null
          map_setup_text_ru?: string | null
          player_count?: number
          scenario_id?: string
          sort_order?: number
          source_page?: number | null
          tile_counts?: Json
          variant_label_en?: string | null
          variant_label_ru?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scenario_map_variants_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      scenario_setup_blocks: {
        Row: {
          block_type: string
          content_en: string | null
          content_ru: string | null
          id: number
          player_count: number | null
          scenario_id: string
          sort_order: number
          structured_data: Json | null
          title_en: string | null
          title_ru: string | null
        }
        Insert: {
          block_type: string
          content_en?: string | null
          content_ru?: string | null
          id?: number
          player_count?: number | null
          scenario_id: string
          sort_order?: number
          structured_data?: Json | null
          title_en?: string | null
          title_ru?: string | null
        }
        Update: {
          block_type?: string
          content_en?: string | null
          content_ru?: string | null
          id?: number
          player_count?: number | null
          scenario_id?: string
          sort_order?: number
          structured_data?: Json | null
          title_en?: string | null
          title_ru?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scenario_setup_blocks_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      scenario_story_sections: {
        Row: {
          content_en: string
          content_ru: string | null
          id: number
          scenario_id: string
          section_key: string
          sort_order: number
          title_en: string
          title_ru: string | null
          trigger_text_en: string | null
          trigger_text_ru: string | null
        }
        Insert: {
          content_en: string
          content_ru?: string | null
          id?: number
          scenario_id: string
          section_key: string
          sort_order?: number
          title_en: string
          title_ru?: string | null
          trigger_text_en?: string | null
          trigger_text_ru?: string | null
        }
        Update: {
          content_en?: string
          content_ru?: string | null
          id?: number
          scenario_id?: string
          section_key?: string
          sort_order?: number
          title_en?: string
          title_ru?: string | null
          trigger_text_en?: string | null
          trigger_text_ru?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scenario_story_sections_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      scenario_timed_events: {
        Row: {
          condition_en: string | null
          condition_ru: string | null
          effect_en: string
          effect_ru: string | null
          id: number
          player_count: number | null
          scenario_id: string
          sort_order: number
          trigger_label_en: string | null
          trigger_label_ru: string | null
          trigger_round: number | null
          trigger_type: string
        }
        Insert: {
          condition_en?: string | null
          condition_ru?: string | null
          effect_en: string
          effect_ru?: string | null
          id?: number
          player_count?: number | null
          scenario_id: string
          sort_order?: number
          trigger_label_en?: string | null
          trigger_label_ru?: string | null
          trigger_round?: number | null
          trigger_type: string
        }
        Update: {
          condition_en?: string | null
          condition_ru?: string | null
          effect_en?: string
          effect_ru?: string | null
          id?: number
          player_count?: number | null
          scenario_id?: string
          sort_order?: number
          trigger_label_en?: string | null
          trigger_label_ru?: string | null
          trigger_round?: number | null
          trigger_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "scenario_timed_events_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      scenarios: {
        Row: {
          book_id: string
          campaign_group_en: string | null
          campaign_group_ru: string | null
          created_at: string
          difficulty_options: Json | null
          difficulty_text_en: string | null
          difficulty_text_ru: string | null
          has_ai_setup: boolean
          has_map_variants: boolean
          has_story: boolean
          id: string
          max_players: number | null
          min_players: number | null
          mode: string
          rounds_max: number | null
          rounds_min: number | null
          scenario_length_text_en: string | null
          scenario_length_text_ru: string | null
          scenario_number: number | null
          slug: string
          sort_order: number
          summary_en: string | null
          summary_ru: string | null
          supported_player_counts: number[] | null
          title_en: string
          title_ru: string | null
          updated_at: string
        }
        Insert: {
          book_id: string
          campaign_group_en?: string | null
          campaign_group_ru?: string | null
          created_at?: string
          difficulty_options?: Json | null
          difficulty_text_en?: string | null
          difficulty_text_ru?: string | null
          has_ai_setup?: boolean
          has_map_variants?: boolean
          has_story?: boolean
          id: string
          max_players?: number | null
          min_players?: number | null
          mode: string
          rounds_max?: number | null
          rounds_min?: number | null
          scenario_length_text_en?: string | null
          scenario_length_text_ru?: string | null
          scenario_number?: number | null
          slug: string
          sort_order?: number
          summary_en?: string | null
          summary_ru?: string | null
          supported_player_counts?: number[] | null
          title_en: string
          title_ru?: string | null
          updated_at?: string
        }
        Update: {
          book_id?: string
          campaign_group_en?: string | null
          campaign_group_ru?: string | null
          created_at?: string
          difficulty_options?: Json | null
          difficulty_text_en?: string | null
          difficulty_text_ru?: string | null
          has_ai_setup?: boolean
          has_map_variants?: boolean
          has_story?: boolean
          id?: string
          max_players?: number | null
          min_players?: number | null
          mode?: string
          rounds_max?: number | null
          rounds_min?: number | null
          scenario_length_text_en?: string | null
          scenario_length_text_ru?: string | null
          scenario_number?: number | null
          slug?: string
          sort_order?: number
          summary_en?: string | null
          summary_ru?: string | null
          supported_player_counts?: number[] | null
          title_en?: string
          title_ru?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scenarios_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "scenario_books"
            referencedColumns: ["id"]
          },
        ]
      }
      spells: {
        Row: {
          effect_en: string | null
          effect_ru: string | null
          embedding_en: string | null
          embedding_ru: string | null
          id: string
          image: string | null
          level: string | null
          name_en: string
          name_ru: string | null
          notes_en: string | null
          notes_ru: string | null
          school: string | null
          search_text_en: string | null
          search_text_ru: string | null
          sort_order: number | null
        }
        Insert: {
          effect_en?: string | null
          effect_ru?: string | null
          embedding_en?: string | null
          embedding_ru?: string | null
          id: string
          image?: string | null
          level?: string | null
          name_en: string
          name_ru?: string | null
          notes_en?: string | null
          notes_ru?: string | null
          school?: string | null
          search_text_en?: string | null
          search_text_ru?: string | null
          sort_order?: number | null
        }
        Update: {
          effect_en?: string | null
          effect_ru?: string | null
          embedding_en?: string | null
          embedding_ru?: string | null
          id?: string
          image?: string | null
          level?: string | null
          name_en?: string
          name_ru?: string | null
          notes_en?: string | null
          notes_ru?: string | null
          school?: string | null
          search_text_en?: string | null
          search_text_ru?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
      statistics: {
        Row: {
          card_type: string | null
          effect_en: string | null
          effect_en_expert: string | null
          effect_en_expert_ru: string | null
          effect_ru: string | null
          embedding_en: string | null
          embedding_ru: string | null
          id: string
          image: string | null
          name_en: string | null
          name_ru: string | null
          notes_en: string | null
          notes_ru: string | null
          search_text_en: string | null
          search_text_ru: string | null
          sort_order: number | null
          stat_type: string | null
        }
        Insert: {
          card_type?: string | null
          effect_en?: string | null
          effect_en_expert?: string | null
          effect_en_expert_ru?: string | null
          effect_ru?: string | null
          embedding_en?: string | null
          embedding_ru?: string | null
          id: string
          image?: string | null
          name_en?: string | null
          name_ru?: string | null
          notes_en?: string | null
          notes_ru?: string | null
          search_text_en?: string | null
          search_text_ru?: string | null
          sort_order?: number | null
          stat_type?: string | null
        }
        Update: {
          card_type?: string | null
          effect_en?: string | null
          effect_en_expert?: string | null
          effect_en_expert_ru?: string | null
          effect_ru?: string | null
          embedding_en?: string | null
          embedding_ru?: string | null
          id?: string
          image?: string | null
          name_en?: string | null
          name_ru?: string | null
          notes_en?: string | null
          notes_ru?: string | null
          search_text_en?: string | null
          search_text_ru?: string | null
          sort_order?: number | null
          stat_type?: string | null
        }
        Relationships: []
      }
      tags: {
        Row: {
          category: string
          id: string
          name_en: string
          name_ru: string
          sort_order: number | null
        }
        Insert: {
          category: string
          id: string
          name_en: string
          name_ru: string
          sort_order?: number | null
        }
        Update: {
          category?: string
          id?: string
          name_en?: string
          name_ru?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      town_buildings: {
        Row: {
          cost: string | null
          effect_en: string | null
          effect_ru: string | null
          embedding_en: string | null
          embedding_ru: string | null
          id: string
          name_en: string
          name_ru: string | null
          search_text_en: string | null
          search_text_ru: string | null
          sort_order: number | null
          town_id: string | null
        }
        Insert: {
          cost?: string | null
          effect_en?: string | null
          effect_ru?: string | null
          embedding_en?: string | null
          embedding_ru?: string | null
          id: string
          name_en: string
          name_ru?: string | null
          search_text_en?: string | null
          search_text_ru?: string | null
          sort_order?: number | null
          town_id?: string | null
        }
        Update: {
          cost?: string | null
          effect_en?: string | null
          effect_ru?: string | null
          embedding_en?: string | null
          embedding_ru?: string | null
          id?: string
          name_en?: string
          name_ru?: string | null
          search_text_en?: string | null
          search_text_ru?: string | null
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
          embedding_en: string | null
          embedding_ru: string | null
          errata_en: string | null
          errata_ru: string | null
          health_points: number | null
          id: string
          image: string | null
          initiative: number | null
          name_en: string
          name_ru: string | null
          notes_en: string | null
          notes_ru: string | null
          number: string | null
          search_text_en: string | null
          search_text_ru: string | null
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
          embedding_en?: string | null
          embedding_ru?: string | null
          errata_en?: string | null
          errata_ru?: string | null
          health_points?: number | null
          id: string
          image?: string | null
          initiative?: number | null
          name_en: string
          name_ru?: string | null
          notes_en?: string | null
          notes_ru?: string | null
          number?: string | null
          search_text_en?: string | null
          search_text_ru?: string | null
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
          embedding_en?: string | null
          embedding_ru?: string | null
          errata_en?: string | null
          errata_ru?: string | null
          health_points?: number | null
          id?: string
          image?: string | null
          initiative?: number | null
          name_en?: string
          name_ru?: string | null
          notes_en?: string | null
          notes_ru?: string | null
          number?: string | null
          search_text_en?: string | null
          search_text_ru?: string | null
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
          embedding_en: string | null
          embedding_ru: string | null
          id: string
          image: string | null
          name_en: string
          name_ru: string | null
          notes_en: string | null
          notes_ru: string | null
          search_text_en: string | null
          search_text_ru: string | null
          sort_order: number | null
        }
        Insert: {
          ability_en?: string | null
          ability_ru?: string | null
          cost_blacksmith?: string | null
          cost_trade_post?: string | null
          embedding_en?: string | null
          embedding_ru?: string | null
          id: string
          image?: string | null
          name_en: string
          name_ru?: string | null
          notes_en?: string | null
          notes_ru?: string | null
          search_text_en?: string | null
          search_text_ru?: string | null
          sort_order?: number | null
        }
        Update: {
          ability_en?: string | null
          ability_ru?: string | null
          cost_blacksmith?: string | null
          cost_trade_post?: string | null
          embedding_en?: string | null
          embedding_ru?: string | null
          id?: string
          image?: string | null
          name_en?: string
          name_ru?: string | null
          notes_en?: string | null
          notes_ru?: string | null
          search_text_en?: string | null
          search_text_ru?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_all_en: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          entity_id: string
          entity_type: string
          name_en: string
          name_ru: string
          similarity: number
        }[]
      }
      match_all_ru: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          entity_id: string
          entity_type: string
          name_en: string
          name_ru: string
          similarity: number
        }[]
      }
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
