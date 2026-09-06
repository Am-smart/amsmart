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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      anti_cheat_logs: {
        Row: {
          course_id: string | null
          created_at: string | null
          id: string
          message: string | null
          metadata: Json | null
          resource_id: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          resource_id?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          resource_id?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "anti_cheat_logs_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anti_cheat_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          allow_late_submissions: boolean | null
          allowed_extensions: string[] | null
          anti_cheat_enabled: boolean | null
          assignment_type: string
          attachments: Json | null
          course_id: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          groups: Json
          hard_enforcement: boolean | null
          id: string
          late_penalty_per_day: number | null
          metadata: Json | null
          points_possible: number | null
          questions: Json | null
          regrade_requests_enabled: boolean | null
          start_at: string | null
          status: string | null
          teacher_id: string | null
          title: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          allow_late_submissions?: boolean | null
          allowed_extensions?: string[] | null
          anti_cheat_enabled?: boolean | null
          assignment_type?: string
          attachments?: Json | null
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          groups?: Json
          hard_enforcement?: boolean | null
          id?: string
          late_penalty_per_day?: number | null
          metadata?: Json | null
          points_possible?: number | null
          questions?: Json | null
          regrade_requests_enabled?: boolean | null
          start_at?: string | null
          status?: string | null
          teacher_id?: string | null
          title: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          allow_late_submissions?: boolean | null
          allowed_extensions?: string[] | null
          anti_cheat_enabled?: boolean | null
          assignment_type?: string
          attachments?: Json | null
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          groups?: Json
          hard_enforcement?: boolean | null
          id?: string
          late_penalty_per_day?: number | null
          metadata?: Json | null
          points_possible?: number | null
          questions?: Json | null
          regrade_requests_enabled?: boolean | null
          start_at?: string | null
          status?: string | null
          teacher_id?: string | null
          title?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          created_at: string | null
          duration: number | null
          id: string
          is_present: boolean | null
          join_time: string | null
          leave_time: string | null
          live_class_id: string | null
          student_id: string | null
        }
        Insert: {
          created_at?: string | null
          duration?: number | null
          id?: string
          is_present?: boolean | null
          join_time?: string | null
          leave_time?: string | null
          live_class_id?: string | null
          student_id?: string | null
        }
        Update: {
          created_at?: string | null
          duration?: number | null
          id?: string
          is_present?: boolean | null
          join_time?: string | null
          leave_time?: string | null
          live_class_id?: string | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_live_class_id_fkey"
            columns: ["live_class_id"]
            isOneToOne: false
            referencedRelation: "live_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      broadcasts: {
        Row: {
          course_id: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          link: string | null
          message: string
          target_role: string | null
          title: string
          type: string | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          link?: string | null
          message: string
          target_role?: string | null
          title: string
          type?: string | null
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          link?: string | null
          message?: string
          target_role?: string | null
          title?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "broadcasts_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      certificate_requests: {
        Row: {
          certificate_id: string | null
          course_id: string
          created_at: string
          decision_reason: string | null
          id: string
          message: string | null
          metadata: Json
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          teacher_note: string | null
          teacher_reviewed_at: string | null
          teacher_reviewed_by: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          certificate_id?: string | null
          course_id: string
          created_at?: string
          decision_reason?: string | null
          id?: string
          message?: string | null
          metadata?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          teacher_note?: string | null
          teacher_reviewed_at?: string | null
          teacher_reviewed_by?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          certificate_id?: string | null
          course_id?: string
          created_at?: string
          decision_reason?: string | null
          id?: string
          message?: string | null
          metadata?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          teacher_note?: string | null
          teacher_reviewed_at?: string | null
          teacher_reviewed_by?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificate_requests_certificate_id_fkey"
            columns: ["certificate_id"]
            isOneToOne: false
            referencedRelation: "certificates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificate_requests_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          code: string
          course_id: string
          course_title: string | null
          created_at: string
          final_grade: number | null
          id: string
          issued_at: string
          issued_by: string | null
          metadata: Json
          pdf_url: string | null
          recipient_name: string | null
          revoked_at: string | null
          revoked_reason: string | null
          template: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          code: string
          course_id: string
          course_title?: string | null
          created_at?: string
          final_grade?: number | null
          id?: string
          issued_at?: string
          issued_by?: string | null
          metadata?: Json
          pdf_url?: string | null
          recipient_name?: string | null
          revoked_at?: string | null
          revoked_reason?: string | null
          template?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          code?: string
          course_id?: string
          course_title?: string | null
          created_at?: string
          final_grade?: number | null
          id?: string
          issued_at?: string
          issued_by?: string | null
          metadata?: Json
          pdf_url?: string | null
          recipient_name?: string | null
          revoked_at?: string | null
          revoked_reason?: string | null
          template?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          archived_at: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          enrollment_id: string | null
          id: string
          max_enrollment: number | null
          metadata: Json | null
          semester: string | null
          status: string | null
          teacher_id: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          enrollment_id?: string | null
          id?: string
          max_enrollment?: number | null
          metadata?: Json | null
          semester?: string | null
          status?: string | null
          teacher_id?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          enrollment_id?: string | null
          id?: string
          max_enrollment?: number | null
          metadata?: Json | null
          semester?: string | null
          status?: string | null
          teacher_id?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      discussion_views: {
        Row: {
          discussion_id: string
          last_viewed_at: string
          user_id: string
        }
        Insert: {
          discussion_id: string
          last_viewed_at?: string
          user_id: string
        }
        Update: {
          discussion_id?: string
          last_viewed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discussion_views_discussion_id_fkey"
            columns: ["discussion_id"]
            isOneToOne: false
            referencedRelation: "discussions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussion_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      discussions: {
        Row: {
          content: string
          course_id: string | null
          created_at: string | null
          id: string
          parent_id: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
          version: number | null
          view_count: number
        }
        Insert: {
          content: string
          course_id?: string | null
          created_at?: string | null
          id?: string
          parent_id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          version?: number | null
          view_count?: number
        }
        Update: {
          content?: string
          course_id?: string | null
          created_at?: string | null
          id?: string
          parent_id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          version?: number | null
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "discussions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussions_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "discussions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          completed: boolean | null
          course_id: string
          enrolled_at: string | null
          progress: number | null
          student_id: string
        }
        Insert: {
          completed?: boolean | null
          course_id: string
          enrolled_at?: string | null
          progress?: number | null
          student_id: string
        }
        Update: {
          completed?: boolean | null
          course_id?: string
          enrolled_at?: string | null
          progress?: number | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          created_at: string | null
          created_by: string | null
          email: string | null
          expires_at: string
          id: string
          role: string
          token_hash: string
          type: string
          used_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          expires_at: string
          id?: string
          role: string
          token_hash: string
          type: string
          used_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          expires_at?: string
          id?: string
          role?: string
          token_hash?: string
          type?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_completions: {
        Row: {
          completed_at: string | null
          id: string
          lesson_id: string | null
          student_id: string | null
        }
        Insert: {
          completed_at?: string | null
          id?: string
          lesson_id?: string | null
          student_id?: string | null
        }
        Update: {
          completed_at?: string | null
          id?: string
          lesson_id?: string | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_completions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_completions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content: string | null
          course_id: string | null
          created_at: string | null
          id: string
          order_index: number | null
          title: string
          topic_id: string | null
          updated_at: string | null
          version: number | null
          video_url: string | null
        }
        Insert: {
          content?: string | null
          course_id?: string | null
          created_at?: string | null
          id?: string
          order_index?: number | null
          title: string
          topic_id?: string | null
          updated_at?: string | null
          version?: number | null
          video_url?: string | null
        }
        Update: {
          content?: string | null
          course_id?: string | null
          created_at?: string | null
          id?: string
          order_index?: number | null
          title?: string
          topic_id?: string | null
          updated_at?: string | null
          version?: number | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      live_classes: {
        Row: {
          actual_end_at: string | null
          course_id: string | null
          created_at: string | null
          description: string | null
          end_at: string
          id: string
          meeting_url: string | null
          metadata: Json | null
          recording_url: string | null
          recurring_config: Json | null
          room_name: string
          start_at: string
          status: string | null
          teacher_id: string | null
          title: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          actual_end_at?: string | null
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          end_at: string
          id?: string
          meeting_url?: string | null
          metadata?: Json | null
          recording_url?: string | null
          recurring_config?: Json | null
          room_name: string
          start_at: string
          status?: string | null
          teacher_id?: string | null
          title: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          actual_end_at?: string | null
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          end_at?: string
          id?: string
          meeting_url?: string | null
          metadata?: Json | null
          recording_url?: string | null
          recurring_config?: Json | null
          room_name?: string
          start_at?: string
          status?: string | null
          teacher_id?: string | null
          title?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "live_classes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          id: string
          manual_until: string | null
          message: string | null
          schedules: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          manual_until?: string | null
          message?: string | null
          schedules?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          manual_until?: string | null
          message?: string | null
          schedules?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      materials: {
        Row: {
          course_id: string | null
          created_at: string | null
          description: string | null
          file_type: string | null
          file_url: string | null
          id: string
          teacher_id: string | null
          title: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          teacher_id?: string | null
          title: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          teacher_id?: string | null
          title?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "materials_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          acknowledged_at: string | null
          broadcast_id: string | null
          created_at: string | null
          dismissed_at: string | null
          expires_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          metadata: Json | null
          title: string
          type: string | null
          user_id: string | null
          viewed_at: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          broadcast_id?: string | null
          created_at?: string | null
          dismissed_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          metadata?: Json | null
          title: string
          type?: string | null
          user_id?: string | null
          viewed_at?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          broadcast_id?: string | null
          created_at?: string | null
          dismissed_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          metadata?: Json | null
          title?: string
          type?: string | null
          user_id?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_broadcast_id_fkey"
            columns: ["broadcast_id"]
            isOneToOne: false
            referencedRelation: "broadcasts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      planner: {
        Row: {
          completed: boolean | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          title: string
          updated_at: string | null
          user_id: string | null
          version: number | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
          version?: number | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "planner_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_submissions: {
        Row: {
          analytics: Json | null
          answers: Json | null
          attempt_number: number | null
          id: string
          quiz_id: string | null
          score: number | null
          started_at: string | null
          status: string | null
          student_id: string | null
          submitted_at: string | null
          time_spent: number | null
          total_points: number | null
          updated_at: string | null
          version: number | null
          violation_count: number | null
        }
        Insert: {
          analytics?: Json | null
          answers?: Json | null
          attempt_number?: number | null
          id?: string
          quiz_id?: string | null
          score?: number | null
          started_at?: string | null
          status?: string | null
          student_id?: string | null
          submitted_at?: string | null
          time_spent?: number | null
          total_points?: number | null
          updated_at?: string | null
          version?: number | null
          violation_count?: number | null
        }
        Update: {
          analytics?: Json | null
          answers?: Json | null
          attempt_number?: number | null
          id?: string
          quiz_id?: string | null
          score?: number | null
          started_at?: string | null
          status?: string | null
          student_id?: string | null
          submitted_at?: string | null
          time_spent?: number | null
          total_points?: number | null
          updated_at?: string | null
          version?: number | null
          violation_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_submissions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          anti_cheat_enabled: boolean | null
          attempts_allowed: number | null
          course_id: string | null
          created_at: string | null
          description: string | null
          end_at: string | null
          hard_enforcement: boolean | null
          id: string
          metadata: Json | null
          passing_score: number | null
          questions: Json | null
          shuffle_questions: boolean | null
          start_at: string | null
          status: string | null
          teacher_id: string | null
          time_limit: number | null
          title: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          anti_cheat_enabled?: boolean | null
          attempts_allowed?: number | null
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          end_at?: string | null
          hard_enforcement?: boolean | null
          id?: string
          metadata?: Json | null
          passing_score?: number | null
          questions?: Json | null
          shuffle_questions?: boolean | null
          start_at?: string | null
          status?: string | null
          teacher_id?: string | null
          time_limit?: number | null
          title: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          anti_cheat_enabled?: boolean | null
          attempts_allowed?: number | null
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          end_at?: string | null
          hard_enforcement?: boolean | null
          id?: string
          metadata?: Json | null
          passing_score?: number | null
          questions?: Json | null
          shuffle_questions?: boolean | null
          start_at?: string | null
          status?: string | null
          teacher_id?: string | null
          time_limit?: number | null
          title?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          ip_address: string | null
          token_hash: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          ip_address?: string | null
          token_hash?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: string | null
          token_hash?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      study_sessions: {
        Row: {
          course_id: string | null
          created_at: string
          ended_at: string | null
          focus_seconds: number
          id: string
          idle_seconds: number
          label: string | null
          lesson_id: string | null
          started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          ended_at?: string | null
          focus_seconds?: number
          id?: string
          idle_seconds?: number
          label?: string | null
          lesson_id?: string | null
          started_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          ended_at?: string | null
          focus_seconds?: number
          id?: string
          idle_seconds?: number
          label?: string | null
          lesson_id?: string | null
          started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_sessions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          answers: Json | null
          assignment_id: string | null
          attachments: Json | null
          feedback: string | null
          file_url: string | null
          final_grade: number | null
          grade: number | null
          graded_at: string | null
          group_id: string | null
          id: string
          late_penalty_applied: number | null
          question_scores: Json | null
          regrade_request: string | null
          response_feedback: Json | null
          status: string | null
          student_id: string | null
          submission_text: string | null
          submitted_at: string | null
          updated_at: string | null
          version: number | null
          violation_count: number | null
        }
        Insert: {
          answers?: Json | null
          assignment_id?: string | null
          attachments?: Json | null
          feedback?: string | null
          file_url?: string | null
          final_grade?: number | null
          grade?: number | null
          graded_at?: string | null
          group_id?: string | null
          id?: string
          late_penalty_applied?: number | null
          question_scores?: Json | null
          regrade_request?: string | null
          response_feedback?: Json | null
          status?: string | null
          student_id?: string | null
          submission_text?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          version?: number | null
          violation_count?: number | null
        }
        Update: {
          answers?: Json | null
          assignment_id?: string | null
          attachments?: Json | null
          feedback?: string | null
          file_url?: string | null
          final_grade?: number | null
          grade?: number | null
          graded_at?: string | null
          group_id?: string | null
          id?: string
          late_penalty_applied?: number | null
          question_scores?: Json | null
          regrade_request?: string | null
          response_feedback?: Json | null
          status?: string | null
          student_id?: string | null
          submission_text?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          version?: number | null
          violation_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string | null
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          priority: string | null
          resolved_at: string | null
          status: string | null
          subject: string
          updated_at: string | null
          user_id: string | null
          version: number | null
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          priority?: string | null
          resolved_at?: string | null
          status?: string | null
          subject: string
          updated_at?: string | null
          user_id?: string | null
          version?: number | null
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          priority?: string | null
          resolved_at?: string | null
          status?: string | null
          subject?: string
          updated_at?: string | null
          user_id?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      system_logs: {
        Row: {
          category: string | null
          course_id: string | null
          created_at: string | null
          id: string
          level: string | null
          message: string | null
          metadata: Json | null
          resource_id: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          course_id?: string | null
          created_at?: string | null
          id?: string
          level?: string | null
          message?: string | null
          metadata?: Json | null
          resource_id?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          course_id?: string | null
          created_at?: string | null
          id?: string
          level?: string | null
          message?: string | null
          metadata?: Json | null
          resource_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_logs_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      topics: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "topics_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          active: boolean | null
          created_at: string | null
          email: string
          failed_attempts: number | null
          flagged: boolean | null
          full_name: string
          id: string
          last_login: string | null
          locked_until: string | null
          lockouts: number | null
          metadata: Json | null
          notification_preferences: Json | null
          password: string
          phone: string | null
          reset_request: Json | null
          role: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          email: string
          failed_attempts?: number | null
          flagged?: boolean | null
          full_name: string
          id?: string
          last_login?: string | null
          locked_until?: string | null
          lockouts?: number | null
          metadata?: Json | null
          notification_preferences?: Json | null
          password: string
          phone?: string | null
          reset_request?: Json | null
          role: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          email?: string
          failed_attempts?: number | null
          flagged?: boolean | null
          full_name?: string
          id?: string
          last_login?: string | null
          locked_until?: string | null
          lockouts?: number | null
          metadata?: Json | null
          notification_preferences?: Json | null
          password?: string
          phone?: string | null
          reset_request?: Json | null
          role?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: []
      }
      violations: {
        Row: {
          assessment_id: string | null
          assessment_title: string | null
          assessment_type: string
          created_at: string
          evidence_url: string | null
          id: string
          kind: string
          message: string | null
          payload: Json
          session_id: string
          severity: string
          timestamp: string
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          assessment_id?: string | null
          assessment_title?: string | null
          assessment_type?: string
          created_at?: string
          evidence_url?: string | null
          id?: string
          kind: string
          message?: string | null
          payload?: Json
          session_id: string
          severity?: string
          timestamp?: string
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          assessment_id?: string | null
          assessment_title?: string | null
          assessment_type?: string
          created_at?: string
          evidence_url?: string | null
          id?: string
          kind?: string
          message?: string | null
          payload?: Json
          session_id?: string
          severity?: string
          timestamp?: string
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "violations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_app_role: { Args: never; Returns: string }
      current_app_user: { Args: never; Returns: string }
      get_active_proctored_sessions: {
        Args: never
        Returns: {
          assessment_id: string
          assessment_title: string
          assessment_type: string
          full_name: string
          high_severity_count: number
          is_online: boolean
          last_activity: string
          session_id: string
          started_at: string
          status: string
          user_email: string
          user_id: string
          violation_count: number
        }[]
      }
      get_user_role: { Args: { p_user_id: string }; Returns: string }
      is_admin: { Args: { p_user_id: string }; Returns: boolean }
      is_assignment_teacher: {
        Args: { p_assignment_id: string; p_user_id: string }
        Returns: boolean
      }
      is_course_teacher: {
        Args: { p_course_id: string; p_user_id: string }
        Returns: boolean
      }
      is_enrolled: {
        Args: { p_course_id: string; p_user_id: string }
        Returns: boolean
      }
      is_lesson_teacher: {
        Args: { p_lesson_id: string; p_user_id: string }
        Returns: boolean
      }
      is_live_class_teacher: {
        Args: { p_live_class_id: string; p_user_id: string }
        Returns: boolean
      }
      is_quiz_teacher: {
        Args: { p_quiz_id: string; p_user_id: string }
        Returns: boolean
      }
      is_teacher: { Args: { p_user_id: string }; Returns: boolean }
      is_teacher_of_student: {
        Args: { p_student_id: string; p_teacher_id: string }
        Returns: boolean
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
