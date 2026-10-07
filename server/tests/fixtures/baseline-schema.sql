--
-- PostgreSQL database dump
--


-- Dumped from database version 17.11 (Debian 17.11-1.pgdg13+2)
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: academic_years; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.academic_years (
    id integer NOT NULL,
    year_name character varying(100) NOT NULL,
    start_month integer NOT NULL,
    start_year integer NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT academic_years_start_month_check CHECK (((start_month >= 1) AND (start_month <= 12)))
);


--
-- Name: academic_years_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.academic_years_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: academic_years_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.academic_years_id_seq OWNED BY public.academic_years.id;


--
-- Name: activity_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activity_categories (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    color character varying(50),
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: activity_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.activity_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: activity_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.activity_categories_id_seq OWNED BY public.activity_categories.id;


--
-- Name: daily_activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_activities (
    id integer NOT NULL,
    resident_id uuid,
    activity_date date NOT NULL,
    activity_category_id integer,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: daily_activities_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.daily_activities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: daily_activities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.daily_activities_id_seq OWNED BY public.daily_activities.id;


--
-- Name: dismissed_alerts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dismissed_alerts (
    id integer NOT NULL,
    device_fingerprint text NOT NULL,
    dismissed_by uuid,
    dismissed_at timestamp without time zone DEFAULT now()
);


--
-- Name: dismissed_alerts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.dismissed_alerts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: dismissed_alerts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.dismissed_alerts_id_seq OWNED BY public.dismissed_alerts.id;


--
-- Name: duty_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.duty_categories (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    color character varying(50),
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: duty_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.duty_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: duty_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.duty_categories_id_seq OWNED BY public.duty_categories.id;


--
-- Name: general_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.general_comments (
    id integer NOT NULL,
    supervisor_id uuid,
    resident_id uuid,
    comment text NOT NULL,
    is_anonymous boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: general_comments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.general_comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: general_comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.general_comments_id_seq OWNED BY public.general_comments.id;


--
-- Name: login_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.login_sessions (
    id integer NOT NULL,
    user_id uuid,
    device_fingerprint text,
    device_info text,
    ip_address text,
    login_time timestamp without time zone DEFAULT now(),
    is_pwa boolean DEFAULT false
);


--
-- Name: login_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.login_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: login_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.login_sessions_id_seq OWNED BY public.login_sessions.id;


--
-- Name: monthly_duties; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.monthly_duties (
    id integer NOT NULL,
    resident_id uuid,
    duty_date date NOT NULL,
    duty_category_id integer,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: monthly_duties_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.monthly_duties_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: monthly_duties_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.monthly_duties_id_seq OWNED BY public.monthly_duties.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    message text NOT NULL,
    read boolean DEFAULT false,
    log_id text,
    created_at timestamp without time zone DEFAULT now(),
    notification_type character varying(20)
);


--
-- Name: presentation_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.presentation_assignments (
    id integer NOT NULL,
    title character varying(500) NOT NULL,
    presentation_type character varying(100) NOT NULL,
    presenter_id uuid,
    moderator_id uuid,
    assigned_by uuid,
    scheduled_date date,
    venue character varying(255),
    description text,
    status character varying(50) DEFAULT 'PENDING'::character varying,
    presentation_id integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    created_by uuid
);


--
-- Name: presentation_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.presentation_assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: presentation_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.presentation_assignments_id_seq OWNED BY public.presentation_assignments.id;


--
-- Name: presentations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.presentations (
    id integer NOT NULL,
    resident_id uuid,
    year_id uuid,
    date date NOT NULL,
    title character varying(500) NOT NULL,
    venue character varying(255) NOT NULL,
    presentation_type character varying(50) NOT NULL,
    description text,
    supervisor_id uuid,
    status character varying(50) DEFAULT 'PENDING'::character varying,
    rating integer,
    comment text,
    rated_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    is_detachment boolean DEFAULT false,
    detachment_type character varying(50),
    external_supervisor_name character varying(255),
    detachment_verified boolean DEFAULT false,
    detachment_rating integer,
    detachment_comment text,
    detachment_verified_by uuid,
    detachment_verified_at timestamp without time zone,
    anonymous_comment text
);


--
-- Name: presentations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.presentations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: presentations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.presentations_id_seq OWNED BY public.presentations.id;


--
-- Name: push_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.push_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    endpoint text NOT NULL,
    p256dh text NOT NULL,
    auth text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: resident_years; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resident_years (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    resident_id uuid,
    year integer NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    residency_start_month integer DEFAULT 7,
    residency_start_year integer
);


--
-- Name: rotation_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rotation_categories (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    color character varying(50),
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: rotation_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.rotation_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: rotation_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.rotation_categories_id_seq OWNED BY public.rotation_categories.id;


--
-- Name: surgical_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.surgical_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    resident_id uuid,
    year_id uuid,
    date date NOT NULL,
    mrn character varying(100) NOT NULL,
    age integer NOT NULL,
    sex character varying(10) NOT NULL,
    diagnosis text NOT NULL,
    procedure text NOT NULL,
    procedure_type character varying(50) NOT NULL,
    place_of_practice character varying(50) NOT NULL,
    surgery_role character varying(50) NOT NULL,
    supervisor_id uuid,
    status character varying(50) DEFAULT 'PENDING'::character varying,
    rating integer,
    comment text,
    rated_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    procedure_category character varying(100) DEFAULT 'MINOR'::character varying,
    remark text,
    postop_followup_comment text,
    postop_followup_at timestamp without time zone,
    is_detachment boolean DEFAULT false,
    detachment_type character varying(50),
    external_supervisor_name character varying(255),
    detachment_verified boolean DEFAULT false,
    detachment_rating integer,
    detachment_comment text,
    detachment_verified_by uuid,
    detachment_verified_at timestamp without time zone,
    anonymous_comment text
);


--
-- Name: user_activity; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_activity (
    id integer NOT NULL,
    user_id uuid,
    action_type text NOT NULL,
    metadata text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: user_activity_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_activity_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_activity_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_activity_id_seq OWNED BY public.user_activity.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    role character varying(50) NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    institution character varying(255),
    specialty character varying(255),
    profile_picture text,
    is_suspended boolean DEFAULT false,
    has_management_access boolean DEFAULT false,
    is_chief_resident boolean DEFAULT false,
    is_senior boolean DEFAULT false,
    last_seen timestamp without time zone,
    is_pwa boolean DEFAULT false
);


--
-- Name: yearly_rotations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.yearly_rotations (
    id integer NOT NULL,
    academic_year_id integer,
    resident_id uuid,
    month_number integer NOT NULL,
    rotation_category_id integer,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT yearly_rotations_month_number_check CHECK (((month_number >= 1) AND (month_number <= 12)))
);


--
-- Name: yearly_rotations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.yearly_rotations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: yearly_rotations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.yearly_rotations_id_seq OWNED BY public.yearly_rotations.id;


--
-- Name: academic_years id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.academic_years ALTER COLUMN id SET DEFAULT nextval('public.academic_years_id_seq'::regclass);


--
-- Name: activity_categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_categories ALTER COLUMN id SET DEFAULT nextval('public.activity_categories_id_seq'::regclass);


--
-- Name: daily_activities id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_activities ALTER COLUMN id SET DEFAULT nextval('public.daily_activities_id_seq'::regclass);


--
-- Name: dismissed_alerts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dismissed_alerts ALTER COLUMN id SET DEFAULT nextval('public.dismissed_alerts_id_seq'::regclass);


--
-- Name: duty_categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.duty_categories ALTER COLUMN id SET DEFAULT nextval('public.duty_categories_id_seq'::regclass);


--
-- Name: general_comments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.general_comments ALTER COLUMN id SET DEFAULT nextval('public.general_comments_id_seq'::regclass);


--
-- Name: login_sessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.login_sessions ALTER COLUMN id SET DEFAULT nextval('public.login_sessions_id_seq'::regclass);


--
-- Name: monthly_duties id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monthly_duties ALTER COLUMN id SET DEFAULT nextval('public.monthly_duties_id_seq'::regclass);


--
-- Name: presentation_assignments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presentation_assignments ALTER COLUMN id SET DEFAULT nextval('public.presentation_assignments_id_seq'::regclass);


--
-- Name: presentations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presentations ALTER COLUMN id SET DEFAULT nextval('public.presentations_id_seq'::regclass);


--
-- Name: rotation_categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rotation_categories ALTER COLUMN id SET DEFAULT nextval('public.rotation_categories_id_seq'::regclass);


--
-- Name: user_activity id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_activity ALTER COLUMN id SET DEFAULT nextval('public.user_activity_id_seq'::regclass);


--
-- Name: yearly_rotations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.yearly_rotations ALTER COLUMN id SET DEFAULT nextval('public.yearly_rotations_id_seq'::regclass);


--
-- Name: academic_years academic_years_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.academic_years
    ADD CONSTRAINT academic_years_pkey PRIMARY KEY (id);


--
-- Name: activity_categories activity_categories_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_categories
    ADD CONSTRAINT activity_categories_name_key UNIQUE (name);


--
-- Name: activity_categories activity_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_categories
    ADD CONSTRAINT activity_categories_pkey PRIMARY KEY (id);


--
-- Name: daily_activities daily_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_activities
    ADD CONSTRAINT daily_activities_pkey PRIMARY KEY (id);


--
-- Name: dismissed_alerts dismissed_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dismissed_alerts
    ADD CONSTRAINT dismissed_alerts_pkey PRIMARY KEY (id);


--
-- Name: duty_categories duty_categories_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.duty_categories
    ADD CONSTRAINT duty_categories_name_key UNIQUE (name);


--
-- Name: duty_categories duty_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.duty_categories
    ADD CONSTRAINT duty_categories_pkey PRIMARY KEY (id);


--
-- Name: general_comments general_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.general_comments
    ADD CONSTRAINT general_comments_pkey PRIMARY KEY (id);


--
-- Name: login_sessions login_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.login_sessions
    ADD CONSTRAINT login_sessions_pkey PRIMARY KEY (id);


--
-- Name: monthly_duties monthly_duties_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monthly_duties
    ADD CONSTRAINT monthly_duties_pkey PRIMARY KEY (id);


--
-- Name: monthly_duties monthly_duties_resident_id_duty_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monthly_duties
    ADD CONSTRAINT monthly_duties_resident_id_duty_date_key UNIQUE (resident_id, duty_date);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: presentation_assignments presentation_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presentation_assignments
    ADD CONSTRAINT presentation_assignments_pkey PRIMARY KEY (id);


--
-- Name: presentations presentations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presentations
    ADD CONSTRAINT presentations_pkey PRIMARY KEY (id);


--
-- Name: push_subscriptions push_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: push_subscriptions push_subscriptions_user_id_endpoint_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_user_id_endpoint_key UNIQUE (user_id, endpoint);


--
-- Name: resident_years resident_years_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resident_years
    ADD CONSTRAINT resident_years_pkey PRIMARY KEY (id);


--
-- Name: resident_years resident_years_resident_id_year_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resident_years
    ADD CONSTRAINT resident_years_resident_id_year_key UNIQUE (resident_id, year);


--
-- Name: rotation_categories rotation_categories_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rotation_categories
    ADD CONSTRAINT rotation_categories_name_key UNIQUE (name);


--
-- Name: rotation_categories rotation_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rotation_categories
    ADD CONSTRAINT rotation_categories_pkey PRIMARY KEY (id);


--
-- Name: surgical_logs surgical_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.surgical_logs
    ADD CONSTRAINT surgical_logs_pkey PRIMARY KEY (id);


--
-- Name: user_activity user_activity_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_activity
    ADD CONSTRAINT user_activity_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: yearly_rotations yearly_rotations_academic_year_id_resident_id_month_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.yearly_rotations
    ADD CONSTRAINT yearly_rotations_academic_year_id_resident_id_month_number_key UNIQUE (academic_year_id, resident_id, month_number);


--
-- Name: yearly_rotations yearly_rotations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.yearly_rotations
    ADD CONSTRAINT yearly_rotations_pkey PRIMARY KEY (id);


--
-- Name: idx_daily_activities_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_daily_activities_date ON public.daily_activities USING btree (activity_date);


--
-- Name: idx_daily_activities_resident; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_daily_activities_resident ON public.daily_activities USING btree (resident_id, activity_date);


--
-- Name: idx_login_sessions_fingerprint; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_login_sessions_fingerprint ON public.login_sessions USING btree (device_fingerprint);


--
-- Name: idx_login_sessions_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_login_sessions_time ON public.login_sessions USING btree (login_time);


--
-- Name: idx_login_sessions_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_login_sessions_user ON public.login_sessions USING btree (user_id);


--
-- Name: idx_logs_resident; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_logs_resident ON public.surgical_logs USING btree (resident_id);


--
-- Name: idx_logs_supervisor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_logs_supervisor ON public.surgical_logs USING btree (supervisor_id);


--
-- Name: idx_logs_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_logs_year ON public.surgical_logs USING btree (year_id);


--
-- Name: idx_monthly_duties_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_monthly_duties_date ON public.monthly_duties USING btree (duty_date);


--
-- Name: idx_monthly_duties_resident; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_monthly_duties_resident ON public.monthly_duties USING btree (resident_id, duty_date);


--
-- Name: idx_notifications_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user ON public.notifications USING btree (user_id);


--
-- Name: idx_presentation_assignments_moderator; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_presentation_assignments_moderator ON public.presentation_assignments USING btree (moderator_id, status);


--
-- Name: idx_presentation_assignments_presenter; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_presentation_assignments_presenter ON public.presentation_assignments USING btree (presenter_id, status);


--
-- Name: idx_presentations_resident; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_presentations_resident ON public.presentations USING btree (resident_id);


--
-- Name: idx_presentations_supervisor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_presentations_supervisor ON public.presentations USING btree (supervisor_id);


--
-- Name: idx_presentations_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_presentations_year ON public.presentations USING btree (year_id);


--
-- Name: idx_push_subscriptions_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_push_subscriptions_user ON public.push_subscriptions USING btree (user_id);


--
-- Name: idx_user_activity_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_activity_type ON public.user_activity USING btree (action_type);


--
-- Name: idx_user_activity_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_activity_user ON public.user_activity USING btree (user_id);


--
-- Name: idx_yearly_rotations_resident; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_yearly_rotations_resident ON public.yearly_rotations USING btree (resident_id, academic_year_id);


--
-- Name: daily_activities daily_activities_activity_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_activities
    ADD CONSTRAINT daily_activities_activity_category_id_fkey FOREIGN KEY (activity_category_id) REFERENCES public.activity_categories(id) ON DELETE SET NULL;


--
-- Name: daily_activities daily_activities_resident_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_activities
    ADD CONSTRAINT daily_activities_resident_id_fkey FOREIGN KEY (resident_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: dismissed_alerts dismissed_alerts_dismissed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dismissed_alerts
    ADD CONSTRAINT dismissed_alerts_dismissed_by_fkey FOREIGN KEY (dismissed_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: general_comments general_comments_resident_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.general_comments
    ADD CONSTRAINT general_comments_resident_id_fkey FOREIGN KEY (resident_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: general_comments general_comments_supervisor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.general_comments
    ADD CONSTRAINT general_comments_supervisor_id_fkey FOREIGN KEY (supervisor_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: login_sessions login_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.login_sessions
    ADD CONSTRAINT login_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: monthly_duties monthly_duties_duty_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monthly_duties
    ADD CONSTRAINT monthly_duties_duty_category_id_fkey FOREIGN KEY (duty_category_id) REFERENCES public.duty_categories(id) ON DELETE SET NULL;


--
-- Name: monthly_duties monthly_duties_resident_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monthly_duties
    ADD CONSTRAINT monthly_duties_resident_id_fkey FOREIGN KEY (resident_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: presentation_assignments presentation_assignments_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presentation_assignments
    ADD CONSTRAINT presentation_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: presentation_assignments presentation_assignments_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presentation_assignments
    ADD CONSTRAINT presentation_assignments_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: presentation_assignments presentation_assignments_moderator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presentation_assignments
    ADD CONSTRAINT presentation_assignments_moderator_id_fkey FOREIGN KEY (moderator_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: presentation_assignments presentation_assignments_presentation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presentation_assignments
    ADD CONSTRAINT presentation_assignments_presentation_id_fkey FOREIGN KEY (presentation_id) REFERENCES public.presentations(id) ON DELETE SET NULL;


--
-- Name: presentation_assignments presentation_assignments_presenter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presentation_assignments
    ADD CONSTRAINT presentation_assignments_presenter_id_fkey FOREIGN KEY (presenter_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: presentations presentations_detachment_verified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presentations
    ADD CONSTRAINT presentations_detachment_verified_by_fkey FOREIGN KEY (detachment_verified_by) REFERENCES public.users(id);


--
-- Name: presentations presentations_resident_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presentations
    ADD CONSTRAINT presentations_resident_id_fkey FOREIGN KEY (resident_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: presentations presentations_supervisor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presentations
    ADD CONSTRAINT presentations_supervisor_id_fkey FOREIGN KEY (supervisor_id) REFERENCES public.users(id);


--
-- Name: presentations presentations_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presentations
    ADD CONSTRAINT presentations_year_id_fkey FOREIGN KEY (year_id) REFERENCES public.resident_years(id) ON DELETE CASCADE;


--
-- Name: push_subscriptions push_subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: resident_years resident_years_resident_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resident_years
    ADD CONSTRAINT resident_years_resident_id_fkey FOREIGN KEY (resident_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: surgical_logs surgical_logs_detachment_verified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.surgical_logs
    ADD CONSTRAINT surgical_logs_detachment_verified_by_fkey FOREIGN KEY (detachment_verified_by) REFERENCES public.users(id);


--
-- Name: surgical_logs surgical_logs_resident_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.surgical_logs
    ADD CONSTRAINT surgical_logs_resident_id_fkey FOREIGN KEY (resident_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: surgical_logs surgical_logs_supervisor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.surgical_logs
    ADD CONSTRAINT surgical_logs_supervisor_id_fkey FOREIGN KEY (supervisor_id) REFERENCES public.users(id);


--
-- Name: surgical_logs surgical_logs_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.surgical_logs
    ADD CONSTRAINT surgical_logs_year_id_fkey FOREIGN KEY (year_id) REFERENCES public.resident_years(id) ON DELETE CASCADE;


--
-- Name: user_activity user_activity_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_activity
    ADD CONSTRAINT user_activity_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: yearly_rotations yearly_rotations_academic_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.yearly_rotations
    ADD CONSTRAINT yearly_rotations_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id) ON DELETE CASCADE;


--
-- Name: yearly_rotations yearly_rotations_resident_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.yearly_rotations
    ADD CONSTRAINT yearly_rotations_resident_id_fkey FOREIGN KEY (resident_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: yearly_rotations yearly_rotations_rotation_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.yearly_rotations
    ADD CONSTRAINT yearly_rotations_rotation_category_id_fkey FOREIGN KEY (rotation_category_id) REFERENCES public.rotation_categories(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--


