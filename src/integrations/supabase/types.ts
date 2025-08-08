export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_logs: {
        Row: {
          action: string
          admin_username: string
          created_at: string
          description: string | null
          id: string
          ip_address: unknown | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_username: string
          created_at?: string
          description?: string | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_username?: string
          created_at?: string
          description?: string | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
        }
        Relationships: []
      }
      approval_workflows: {
        Row: {
          approver_id: string
          comments: string | null
          created_at: string | null
          decision_date: string | null
          entity_id: string
          entity_type: string
          id: string
          requester_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          approver_id: string
          comments?: string | null
          created_at?: string | null
          decision_date?: string | null
          entity_id: string
          entity_type: string
          id?: string
          requester_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          approver_id?: string
          comments?: string | null
          created_at?: string | null
          decision_date?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          requester_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      assessment_questions: {
        Row: {
          assessment_id: string | null
          correct_answer: string | null
          created_at: string | null
          id: string
          options: Json | null
          order_index: number | null
          points: number | null
          question_text: string
          question_type: string | null
          updated_at: string | null
        }
        Insert: {
          assessment_id?: string | null
          correct_answer?: string | null
          created_at?: string | null
          id?: string
          options?: Json | null
          order_index?: number | null
          points?: number | null
          question_text: string
          question_type?: string | null
          updated_at?: string | null
        }
        Update: {
          assessment_id?: string | null
          correct_answer?: string | null
          created_at?: string | null
          id?: string
          options?: Json | null
          order_index?: number | null
          points?: number | null
          question_text?: string
          question_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_questions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_submissions: {
        Row: {
          answers_data: Json | null
          assessment_id: string
          created_at: string
          id: string
          max_score: number | null
          started_at: string
          status: string
          student_id: string
          submitted_at: string | null
          time_spent_minutes: number | null
          total_score: number | null
          updated_at: string
        }
        Insert: {
          answers_data?: Json | null
          assessment_id: string
          created_at?: string
          id?: string
          max_score?: number | null
          started_at?: string
          status?: string
          student_id: string
          submitted_at?: string | null
          time_spent_minutes?: number | null
          total_score?: number | null
          updated_at?: string
        }
        Update: {
          answers_data?: Json | null
          assessment_id?: string
          created_at?: string
          id?: string
          max_score?: number | null
          started_at?: string
          status?: string
          student_id?: string
          submitted_at?: string | null
          time_spent_minutes?: number | null
          total_score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_submissions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          class_id: string | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          end_date: string | null
          id: string
          is_published: boolean | null
          start_date: string | null
          title: string
          total_points: number | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          class_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          end_date?: string | null
          id?: string
          is_published?: boolean | null
          start_date?: string | null
          title: string
          total_points?: number | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          class_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          end_date?: string | null
          id?: string
          is_published?: boolean | null
          start_date?: string | null
          title?: string
          total_points?: number | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_receipts: {
        Row: {
          attendance_record_id: string | null
          class_id: string | null
          created_at: string | null
          event_id: string | null
          id: string
          print_method: string | null
          printed_at: string | null
          printer_info: Json | null
          receipt_data: Json
          receipt_number: string
          status: string | null
          student_id: string | null
          template_id: string | null
          updated_at: string | null
        }
        Insert: {
          attendance_record_id?: string | null
          class_id?: string | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          print_method?: string | null
          printed_at?: string | null
          printer_info?: Json | null
          receipt_data: Json
          receipt_number: string
          status?: string | null
          student_id?: string | null
          template_id?: string | null
          updated_at?: string | null
        }
        Update: {
          attendance_record_id?: string | null
          class_id?: string | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          print_method?: string | null
          printed_at?: string | null
          printer_info?: Json | null
          receipt_data?: Json
          receipt_number?: string
          status?: string | null
          student_id?: string | null
          template_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_receipts_attendance_record_id_fkey"
            columns: ["attendance_record_id"]
            isOneToOne: false
            referencedRelation: "attendance_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_receipts_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_receipts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          approved_by: string | null
          attendance_type: string
          check_in_time: string | null
          check_out_time: string | null
          class_id: string | null
          created_at: string
          event_id: string | null
          id: string
          is_retroactive: boolean | null
          location_data: Json | null
          notes: string | null
          retroactive_reason: string | null
          status: string
          student_id: string
          updated_at: string
          verification_method: string | null
          verified_by: string | null
        }
        Insert: {
          approved_by?: string | null
          attendance_type?: string
          check_in_time?: string | null
          check_out_time?: string | null
          class_id?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          is_retroactive?: boolean | null
          location_data?: Json | null
          notes?: string | null
          retroactive_reason?: string | null
          status?: string
          student_id: string
          updated_at?: string
          verification_method?: string | null
          verified_by?: string | null
        }
        Update: {
          approved_by?: string | null
          attendance_type?: string
          check_in_time?: string | null
          check_out_time?: string | null
          class_id?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          is_retroactive?: boolean | null
          location_data?: Json | null
          notes?: string | null
          retroactive_reason?: string | null
          status?: string
          student_id?: string
          updated_at?: string
          verification_method?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      attendances: {
        Row: {
          approved_by: string | null
          class_id: string | null
          created_at: string | null
          date: string
          id: string
          is_retroactive: boolean | null
          notes: string | null
          retroactive_reason: string | null
          session_id: string | null
          status: string | null
          student_id: string | null
          updated_at: string | null
        }
        Insert: {
          approved_by?: string | null
          class_id?: string | null
          created_at?: string | null
          date: string
          id?: string
          is_retroactive?: boolean | null
          notes?: string | null
          retroactive_reason?: string | null
          session_id?: string | null
          status?: string | null
          student_id?: string | null
          updated_at?: string | null
        }
        Update: {
          approved_by?: string | null
          class_id?: string | null
          created_at?: string | null
          date?: string
          id?: string
          is_retroactive?: boolean | null
          notes?: string | null
          retroactive_reason?: string | null
          session_id?: string | null
          status?: string | null
          student_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendances_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendances_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendances_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "class_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      auth_users_backup: {
        Row: {
          created_at: string | null
          email: string
          email_confirmed_at: string | null
          encrypted_password: string
          id: string
          profile_id: string | null
          raw_user_meta_data: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          email_confirmed_at?: string | null
          encrypted_password: string
          id?: string
          profile_id?: string | null
          raw_user_meta_data?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          email_confirmed_at?: string | null
          encrypted_password?: string
          id?: string
          profile_id?: string | null
          raw_user_meta_data?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      auto_billing_executions: {
        Row: {
          created_at: string | null
          error_message: string | null
          execution_date: string
          fees_generated: number
          id: string
          rule_id: string
          status: string
          total_amount: number
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          execution_date?: string
          fees_generated?: number
          id?: string
          rule_id: string
          status?: string
          total_amount?: number
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          execution_date?: string
          fees_generated?: number
          id?: string
          rule_id?: string
          status?: string
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "auto_billing_executions_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "auto_billing_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      auto_billing_rules: {
        Row: {
          active: boolean | null
          amount: number
          billing_day: number
          class_id: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          student_ids: string[] | null
          subject_id: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          amount: number
          billing_day: number
          class_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          student_ids?: string[] | null
          subject_id?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          amount?: number
          billing_day?: number
          class_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          student_ids?: string[] | null
          subject_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auto_billing_rules_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auto_billing_rules_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          certificate_number: string | null
          certificate_type: string
          class_id: string | null
          course_id: string | null
          created_at: string
          file_url: string | null
          id: string
          issue_date: string
          issued_by: string | null
          status: string
          student_id: string
          template_used: string | null
          updated_at: string
          validation_code: string | null
        }
        Insert: {
          certificate_number?: string | null
          certificate_type?: string
          class_id?: string | null
          course_id?: string | null
          created_at?: string
          file_url?: string | null
          id?: string
          issue_date?: string
          issued_by?: string | null
          status?: string
          student_id: string
          template_used?: string | null
          updated_at?: string
          validation_code?: string | null
        }
        Update: {
          certificate_number?: string | null
          certificate_type?: string
          class_id?: string | null
          course_id?: string | null
          created_at?: string
          file_url?: string | null
          id?: string
          issue_date?: string
          issued_by?: string | null
          status?: string
          student_id?: string
          template_used?: string | null
          updated_at?: string
          validation_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificates_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      class_materials: {
        Row: {
          class_id: string | null
          created_at: string | null
          description: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: string
          is_public: boolean | null
          material_type: string | null
          teacher_id: string | null
          title: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          class_id?: string | null
          created_at?: string | null
          description?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_public?: boolean | null
          material_type?: string | null
          teacher_id?: string | null
          title: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          class_id?: string | null
          created_at?: string | null
          description?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_public?: boolean | null
          material_type?: string | null
          teacher_id?: string | null
          title?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_materials_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      class_schedules: {
        Row: {
          class_id: string | null
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          location: string | null
          start_time: string
          updated_at: string | null
        }
        Insert: {
          class_id?: string | null
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          location?: string | null
          start_time: string
          updated_at?: string | null
        }
        Update: {
          class_id?: string | null
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          location?: string | null
          start_time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_schedules_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      class_sessions: {
        Row: {
          class_id: string | null
          created_at: string | null
          description: string | null
          id: string
          session_date: string
          session_time: string | null
          status: string | null
          topic: string | null
          updated_at: string | null
        }
        Insert: {
          class_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          session_date: string
          session_time?: string | null
          status?: string | null
          topic?: string | null
          updated_at?: string | null
        }
        Update: {
          class_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          session_date?: string
          session_time?: string | null
          status?: string | null
          topic?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_sessions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      class_subjects: {
        Row: {
          class_id: string
          created_at: string | null
          id: string
          is_primary: boolean | null
          order_index: number | null
          subject_id: string
          updated_at: string | null
        }
        Insert: {
          class_id: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          order_index?: number | null
          subject_id: string
          updated_at?: string | null
        }
        Update: {
          class_id?: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          order_index?: number | null
          subject_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_subjects_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          congregation_id: string | null
          created_at: string | null
          end_date: string | null
          id: string
          max_students: number | null
          name: string
          professor_id: string | null
          schedule: string | null
          start_date: string | null
          status: string | null
          subject_id: string | null
          updated_at: string | null
        }
        Insert: {
          congregation_id?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          max_students?: number | null
          name: string
          professor_id?: string | null
          schedule?: string | null
          start_date?: string | null
          status?: string | null
          subject_id?: string | null
          updated_at?: string | null
        }
        Update: {
          congregation_id?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          max_students?: number | null
          name?: string
          professor_id?: string | null
          schedule?: string | null
          start_date?: string | null
          status?: string | null
          subject_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_congregation_id_fkey"
            columns: ["congregation_id"]
            isOneToOne: false
            referencedRelation: "congregations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      congregations: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          pastor_name: string | null
          phone: string | null
          postal_code: string | null
          state: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          pastor_name?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          pastor_name?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      course_subjects: {
        Row: {
          course_id: string
          created_at: string
          id: string
          is_required: boolean | null
          order_index: number | null
          subject_id: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          is_required?: boolean | null
          order_index?: number | null
          subject_id: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          is_required?: boolean | null
          order_index?: number | null
          subject_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_subjects_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string | null
          description: string | null
          duration_months: number | null
          id: string
          name: string
          total_credits: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration_months?: number | null
          id?: string
          name: string
          total_credits?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration_months?: number | null
          id?: string
          name?: string
          total_credits?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          class_id: string | null
          course_id: string | null
          created_at: string | null
          enrollment_date: string | null
          final_grade: number | null
          id: string
          status: string | null
          student_id: string | null
          updated_at: string | null
        }
        Insert: {
          class_id?: string | null
          course_id?: string | null
          created_at?: string | null
          enrollment_date?: string | null
          final_grade?: number | null
          id?: string
          status?: string | null
          student_id?: string | null
          updated_at?: string | null
        }
        Update: {
          class_id?: string | null
          course_id?: string | null
          created_at?: string | null
          enrollment_date?: string | null
          final_grade?: number | null
          id?: string
          status?: string | null
          student_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          class_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_datetime: string
          event_type: string
          id: string
          is_retroactive: boolean | null
          location: string | null
          max_attendees: number | null
          retroactive_reason: string | null
          start_datetime: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_datetime: string
          event_type?: string
          id?: string
          is_retroactive?: boolean | null
          location?: string | null
          max_attendees?: number | null
          retroactive_reason?: string | null
          start_datetime: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_datetime?: string
          event_type?: string
          id?: string
          is_retroactive?: boolean | null
          location?: string | null
          max_attendees?: number | null
          retroactive_reason?: string | null
          start_datetime?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      fields: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          responsible_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          responsible_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          responsible_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      grades: {
        Row: {
          assessment_type: string
          class_id: string | null
          created_at: string | null
          date: string | null
          grade: number
          id: string
          max_grade: number | null
          notes: string | null
          student_id: string | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          assessment_type: string
          class_id?: string | null
          created_at?: string | null
          date?: string | null
          grade: number
          id?: string
          max_grade?: number | null
          notes?: string | null
          student_id?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          assessment_type?: string
          class_id?: string | null
          created_at?: string | null
          date?: string | null
          grade?: number
          id?: string
          max_grade?: number | null
          notes?: string | null
          student_id?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "grades_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      inter_profile_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          message_type: string | null
          recipient_id: string
          related_entity_id: string | null
          related_entity_type: string | null
          sender_id: string
          status: string | null
          subject: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          message_type?: string | null
          recipient_id: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          sender_id: string
          status?: string | null
          subject: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          message_type?: string | null
          recipient_id?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          sender_id?: string
          status?: string | null
          subject?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          attempt_time: string | null
          email: string
          id: string
          ip_address: unknown | null
          success: boolean | null
          user_agent: string | null
        }
        Insert: {
          attempt_time?: string | null
          email: string
          id?: string
          ip_address?: unknown | null
          success?: boolean | null
          user_agent?: string | null
        }
        Update: {
          attempt_time?: string | null
          email?: string
          id?: string
          ip_address?: unknown | null
          success?: boolean | null
          user_agent?: string | null
        }
        Relationships: []
      }
      materials: {
        Row: {
          created_at: string
          description: string | null
          download_count: number
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: string
          is_public: boolean
          material_type: string
          professor_id: string | null
          subject_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          download_count?: number
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_public?: boolean
          material_type?: string
          professor_id?: string | null
          subject_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          download_count?: number
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_public?: boolean
          material_type?: string
          professor_id?: string | null
          subject_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "materials_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      member_indications: {
        Row: {
          congregation_id: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          indicating_member_id: string | null
          notes: string | null
          phone: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          congregation_id?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          indicating_member_id?: string | null
          notes?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          congregation_id?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          indicating_member_id?: string | null
          notes?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_indications_congregation_id_fkey"
            columns: ["congregation_id"]
            isOneToOne: false
            referencedRelation: "congregations"
            referencedColumns: ["id"]
          },
        ]
      }
      member_requests: {
        Row: {
          address: string | null
          admin_notes: string | null
          approved_at: string | null
          approved_by: string | null
          bio: string | null
          birth_date: string | null
          congregation: string | null
          congregation_id: string | null
          cpf: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          rejection_reason: string | null
          requested_role: Database["public"]["Enums"]["user_role"] | null
          status: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          bio?: string | null
          birth_date?: string | null
          congregation?: string | null
          congregation_id?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          phone?: string | null
          rejection_reason?: string | null
          requested_role?: Database["public"]["Enums"]["user_role"] | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          bio?: string | null
          birth_date?: string | null
          congregation?: string | null
          congregation_id?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          rejection_reason?: string | null
          requested_role?: Database["public"]["Enums"]["user_role"] | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_requests_congregation_id_fkey"
            columns: ["congregation_id"]
            isOneToOne: false
            referencedRelation: "congregations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          course_id: string | null
          created_at: string | null
          due_date: string
          id: string
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          status: string | null
          student_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          course_id?: string | null
          created_at?: string | null
          due_date: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          status?: string | null
          student_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          course_id?: string | null
          created_at?: string | null
          due_date?: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          status?: string | null
          student_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          absence_end_date: string | null
          absence_reason: string | null
          absence_start_date: string | null
          badge_number: string | null
          can_edit: boolean | null
          congregation_id: string | null
          cpf: string
          email: string | null
          email_confirmed_at: string | null
          field_id: string | null
          first_login: boolean | null
          full_name: string
          id: string
          inserted_at: string | null
          is_absent: boolean | null
          last_login: string | null
          last_password_change: string | null
          password_hash: string | null
          permissions: Json | null
          phone: string | null
          photo_url: string | null
          pin: string | null
          pin_attempts: number | null
          pin_hash: string | null
          pin_locked_until: string | null
          privacy_policy_accepted: boolean | null
          privacy_policy_accepted_at: string | null
          qr_code: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: string | null
          tela_permitida: string | null
          terms_accepted: boolean | null
          terms_accepted_at: string | null
          two_factor_enabled: boolean | null
          two_factor_pin: string | null
          two_factor_secret: string | null
          updated_at: string | null
        }
        Insert: {
          absence_end_date?: string | null
          absence_reason?: string | null
          absence_start_date?: string | null
          badge_number?: string | null
          can_edit?: boolean | null
          congregation_id?: string | null
          cpf: string
          email?: string | null
          email_confirmed_at?: string | null
          field_id?: string | null
          first_login?: boolean | null
          full_name: string
          id?: string
          inserted_at?: string | null
          is_absent?: boolean | null
          last_login?: string | null
          last_password_change?: string | null
          password_hash?: string | null
          permissions?: Json | null
          phone?: string | null
          photo_url?: string | null
          pin?: string | null
          pin_attempts?: number | null
          pin_hash?: string | null
          pin_locked_until?: string | null
          privacy_policy_accepted?: boolean | null
          privacy_policy_accepted_at?: string | null
          qr_code?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: string | null
          tela_permitida?: string | null
          terms_accepted?: boolean | null
          terms_accepted_at?: string | null
          two_factor_enabled?: boolean | null
          two_factor_pin?: string | null
          two_factor_secret?: string | null
          updated_at?: string | null
        }
        Update: {
          absence_end_date?: string | null
          absence_reason?: string | null
          absence_start_date?: string | null
          badge_number?: string | null
          can_edit?: boolean | null
          congregation_id?: string | null
          cpf?: string
          email?: string | null
          email_confirmed_at?: string | null
          field_id?: string | null
          first_login?: boolean | null
          full_name?: string
          id?: string
          inserted_at?: string | null
          is_absent?: boolean | null
          last_login?: string | null
          last_password_change?: string | null
          password_hash?: string | null
          permissions?: Json | null
          phone?: string | null
          photo_url?: string | null
          pin?: string | null
          pin_attempts?: number | null
          pin_hash?: string | null
          pin_locked_until?: string | null
          privacy_policy_accepted?: boolean | null
          privacy_policy_accepted_at?: string | null
          qr_code?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: string | null
          tela_permitida?: string | null
          terms_accepted?: boolean | null
          terms_accepted_at?: string | null
          two_factor_enabled?: boolean | null
          two_factor_pin?: string | null
          two_factor_secret?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      receipt_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          paper_size: string | null
          template_data: Json
          template_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          paper_size?: string | null
          template_data: Json
          template_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          paper_size?: string | null
          template_data?: Json
          template_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permissions: Json
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          permissions?: Json
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          permissions?: Json
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      scheduled_absences: {
        Row: {
          created_at: string | null
          created_by: string | null
          end_date: string
          id: string
          is_active: boolean | null
          person_id: string
          reason: string
          start_date: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          end_date: string
          id?: string
          is_active?: boolean | null
          person_id: string
          reason: string
          start_date: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          end_date?: string
          id?: string
          is_active?: boolean | null
          person_id?: string
          reason?: string
          start_date?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      security_audit_logs: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          severity: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_events: {
        Row: {
          additional_data: Json | null
          created_at: string | null
          event_description: string
          event_type: string
          id: string
          ip_address: unknown | null
          risk_level: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          additional_data?: Json | null
          created_at?: string | null
          event_description: string
          event_type: string
          id?: string
          ip_address?: unknown | null
          risk_level?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          additional_data?: Json | null
          created_at?: string | null
          event_description?: string
          event_type?: string
          id?: string
          ip_address?: unknown | null
          risk_level?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      student_answers: {
        Row: {
          answer_text: string | null
          assessment_id: string | null
          created_at: string | null
          id: string
          is_correct: boolean | null
          points_earned: number | null
          question_id: string | null
          student_id: string | null
          submitted_at: string | null
          updated_at: string | null
        }
        Insert: {
          answer_text?: string | null
          assessment_id?: string | null
          created_at?: string | null
          id?: string
          is_correct?: boolean | null
          points_earned?: number | null
          question_id?: string | null
          student_id?: string | null
          submitted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          answer_text?: string | null
          assessment_id?: string | null
          created_at?: string | null
          id?: string
          is_correct?: boolean | null
          points_earned?: number | null
          question_id?: string | null
          student_id?: string | null
          submitted_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_answers_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "assessment_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          code: string | null
          course_id: string | null
          created_at: string | null
          credits: number | null
          description: string | null
          id: string
          name: string
          professor_id: string | null
          updated_at: string | null
          workload_hours: number | null
        }
        Insert: {
          code?: string | null
          course_id?: string | null
          created_at?: string | null
          credits?: number | null
          description?: string | null
          id?: string
          name: string
          professor_id?: string | null
          updated_at?: string | null
          workload_hours?: number | null
        }
        Update: {
          code?: string | null
          course_id?: string | null
          created_at?: string | null
          credits?: number | null
          description?: string | null
          id?: string
          name?: string
          professor_id?: string | null
          updated_at?: string | null
          workload_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "subjects_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      system_communications: {
        Row: {
          communication_type: string
          created_at: string
          delivery_method: string[] | null
          expires_at: string | null
          id: string
          message: string
          priority: string
          read_by: string[] | null
          scheduled_for: string | null
          sender_id: string | null
          sent_at: string | null
          status: string
          target_audience: string
          target_congregations: string[] | null
          target_roles: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          communication_type?: string
          created_at?: string
          delivery_method?: string[] | null
          expires_at?: string | null
          id?: string
          message: string
          priority?: string
          read_by?: string[] | null
          scheduled_for?: string | null
          sender_id?: string | null
          sent_at?: string | null
          status?: string
          target_audience?: string
          target_congregations?: string[] | null
          target_roles?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          communication_type?: string
          created_at?: string
          delivery_method?: string[] | null
          expires_at?: string | null
          id?: string
          message?: string
          priority?: string
          read_by?: string[] | null
          scheduled_for?: string | null
          sender_id?: string | null
          sent_at?: string | null
          status?: string
          target_audience?: string
          target_congregations?: string[] | null
          target_roles?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_configurations: {
        Row: {
          created_at: string
          customization: Json | null
          expiration_date: string | null
          features: Json | null
          id: string
          license_key: string | null
          max_users: number | null
          system_name: string
          updated_at: string
          version: string
        }
        Insert: {
          created_at?: string
          customization?: Json | null
          expiration_date?: string | null
          features?: Json | null
          id?: string
          license_key?: string | null
          max_users?: number | null
          system_name?: string
          updated_at?: string
          version?: string
        }
        Update: {
          created_at?: string
          customization?: Json | null
          expiration_date?: string | null
          features?: Json | null
          id?: string
          license_key?: string | null
          max_users?: number | null
          system_name?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      system_licenses: {
        Row: {
          created_at: string
          expiration_date: string | null
          features: Json | null
          id: string
          license_key: string
          max_users: number | null
          organization_name: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          expiration_date?: string | null
          features?: Json | null
          id?: string
          license_key: string
          max_users?: number | null
          organization_name?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          expiration_date?: string | null
          features?: Json | null
          id?: string
          license_key?: string
          max_users?: number | null
          organization_name?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tuition_fees: {
        Row: {
          amount: number
          class_id: string | null
          created_at: string | null
          due_date: string
          id: string
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          status: string | null
          student_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          class_id?: string | null
          created_at?: string | null
          due_date: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          status?: string | null
          student_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          class_id?: string | null
          created_at?: string | null
          due_date?: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          status?: string | null
          student_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tuition_fees_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_terms_and_privacy: {
        Args: { user_id: string }
        Returns: Json
      }
      authenticate_admin_by_email: {
        Args: { p_email: string; p_password: string }
        Returns: Json
      }
      authenticate_by_cpf: {
        Args: { cpf_input: string }
        Returns: Json
      }
      authenticate_by_email: {
        Args: { p_email: string; p_password: string }
        Returns: Json
      }
      authenticate_user_by_email: {
        Args: { user_email: string; user_password: string }
        Returns: Json
      }
      calculate_student_attendance: {
        Args: { student_uuid: string; class_uuid?: string }
        Returns: number
      }
      calculate_student_average: {
        Args: { student_uuid: string; class_uuid?: string }
        Returns: number
      }
      can_manage_courses: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      can_mark_attendance: {
        Args: {
          p_student_id: string
          p_class_id?: string
          p_event_id?: string
          p_date?: string
        }
        Returns: boolean
      }
      can_user_access_class: {
        Args: { class_id: string }
        Returns: boolean
      }
      check_rate_limit: {
        Args: {
          p_identifier: string
          p_action_type: string
          p_max_attempts?: number
          p_window_minutes?: number
        }
        Returns: boolean
      }
      clean_hardcoded_credentials: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      create_admin_auth_user: {
        Args: { user_email: string; user_password?: string }
        Returns: Json
      }
      create_admin_auth_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          email: string
          password: string
          result: string
        }[]
      }
      create_admin_users_in_auth: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      create_auth_account_for_admin: {
        Args: { user_email: string; user_password?: string }
        Returns: Json
      }
      create_auth_user_for_director: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      create_auth_users_from_profiles: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      create_director_auth_user: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      create_supabase_auth_for_profile: {
        Args: { user_email: string; user_password?: string }
        Returns: Json
      }
      generate_badge_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_certificate_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_qr_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_receipt_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_subject_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_validation_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_all_people: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          full_name: string
          cpf: string
          email: string
          phone: string
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["user_status"]
          qr_code: string
          badge_number: string
          photo_url: string
          congregation_name: string
          field_name: string
        }[]
      }
      get_attendance_summary: {
        Args: {
          p_start_date?: string
          p_end_date?: string
          p_class_id?: string
          p_event_id?: string
        }
        Returns: {
          id: string
          student_id: string
          student_name: string
          student_cpf: string
          badge_number: string
          class_id: string
          class_name: string
          event_id: string
          event_title: string
          status: string
          attendance_type: string
          verification_method: string
          check_in_time: string
          check_out_time: string
          created_at: string
        }[]
      }
      get_current_authenticated_user: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_people_paginated: {
        Args: {
          page_offset?: number
          page_limit?: number
          search_term?: string
        }
        Returns: {
          id: string
          full_name: string
          cpf: string
          email: string
          phone: string
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["user_status"]
          qr_code: string
          badge_number: string
          photo_url: string
          congregation_name: string
          field_name: string
          total_count: number
        }[]
      }
      get_user_role_by_id: {
        Args: { user_id: string }
        Returns: string
      }
      has_role_permission: {
        Args: { required_role: Database["public"]["Enums"]["user_role"] }
        Returns: boolean
      }
      hash_password: {
        Args: { plain_password: string }
        Returns: string
      }
      is_admin_or_coordinator: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin_user: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_director_or_secretary: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_login_blocked: {
        Args: { p_email: string; p_ip_address?: unknown }
        Returns: boolean
      }
      is_pastor: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_person_absent: {
        Args: { person_uuid: string; check_date?: string }
        Returns: boolean
      }
      is_secretary: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_self: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_teacher: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_authentication_event: {
        Args: {
          p_user_id?: string
          p_event_type?: string
          p_ip_address?: string
          p_user_agent?: string
          p_success?: boolean
          p_additional_data?: Json
        }
        Returns: undefined
      }
      log_login_attempt: {
        Args: {
          p_email: string
          p_success: boolean
          p_ip_address?: unknown
          p_user_agent?: string
        }
        Returns: undefined
      }
      log_security_event: {
        Args: {
          event_type: string
          event_description: string
          risk_level?: string
          additional_data?: Json
        }
        Returns: undefined
      }
      mark_communication_as_read: {
        Args: { communication_id: string; user_id: string }
        Returns: undefined
      }
      reactivate_expired_absences: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      reset_pin_attempts_if_expired: {
        Args: { user_id: string }
        Returns: undefined
      }
      reset_user_password: {
        Args: { user_cpf: string }
        Returns: boolean
      }
      reset_user_pin_admin: {
        Args: { target_cpf: string; new_pin: string; admin_user_id: string }
        Returns: Json
      }
      search_people: {
        Args: { search_term: string }
        Returns: {
          id: string
          full_name: string
          cpf: string
          email: string
          phone: string
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["user_status"]
          qr_code: string
          badge_number: string
          photo_url: string
          congregation_name: string
          field_name: string
        }[]
      }
      set_two_factor_pin: {
        Args: { user_id: string; new_pin: string }
        Returns: Json
      }
      set_user_pin: {
        Args: { input_cpf: string; new_pin: string }
        Returns: Json
      }
      setup_user_pin: {
        Args: { user_id: string; pin_code: string }
        Returns: boolean
      }
      system_needs_setup: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      user_has_permission: {
        Args: { permission_path: string; action: string }
        Returns: boolean
      }
      verify_two_factor_pin: {
        Args: { user_id: string; pin_input: string }
        Returns: Json
      }
      verify_user_pin: {
        Args: { cpf_input: string; pin_input: string }
        Returns: Json
      }
    }
    Enums: {
      user_role:
        | "admin"
        | "coordenador"
        | "professor"
        | "aluno"
        | "membro"
        | "pastor"
        | "secretario"
        | "diretor"
      user_status: "ativo" | "inativo" | "pendente"
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
    Enums: {
      user_role: [
        "admin",
        "coordenador",
        "professor",
        "aluno",
        "membro",
        "pastor",
        "secretario",
        "diretor",
      ],
      user_status: ["ativo", "inativo", "pendente"],
    },
  },
} as const
