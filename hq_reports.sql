--
-- PostgreSQL database dump
--

-- Dumped from database version 12.3
-- Dumped by pg_dump version 12.3

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

--
-- Name: admin; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA admin;


ALTER SCHEMA admin OWNER TO postgres;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: user_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_status AS ENUM (
    'active',
    'blocked',
    'inactive'
);


ALTER TYPE public.user_status OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: permissions; Type: TABLE; Schema: admin; Owner: postgres
--

CREATE TABLE admin.permissions (
    id integer NOT NULL,
    slug character varying(160) NOT NULL,
    description character varying(60) NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE admin.permissions OWNER TO postgres;

--
-- Name: permissions_id_seq; Type: SEQUENCE; Schema: admin; Owner: postgres
--

CREATE SEQUENCE admin.permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE admin.permissions_id_seq OWNER TO postgres;

--
-- Name: permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: admin; Owner: postgres
--

ALTER SEQUENCE admin.permissions_id_seq OWNED BY admin.permissions.id;


--
-- Name: roles; Type: TABLE; Schema: admin; Owner: postgres
--

CREATE TABLE admin.roles (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE admin.roles OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: admin; Owner: postgres
--

CREATE SEQUENCE admin.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE admin.roles_id_seq OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: admin; Owner: postgres
--

ALTER SEQUENCE admin.roles_id_seq OWNED BY admin.roles.id;


--
-- Name: roles_permissions; Type: TABLE; Schema: admin; Owner: postgres
--

CREATE TABLE admin.roles_permissions (
    role_id integer NOT NULL,
    permission_id integer NOT NULL
);


ALTER TABLE admin.roles_permissions OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: admin; Owner: postgres
--

CREATE TABLE admin.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    username character varying(20) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    password character varying NOT NULL,
    is_super_user boolean DEFAULT false NOT NULL,
    status public.user_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    iiko_terminal_id uuid,
    project character varying(255)
);


ALTER TABLE admin.users OWNER TO postgres;

--
-- Name: users_permissions; Type: TABLE; Schema: admin; Owner: postgres
--

CREATE TABLE admin.users_permissions (
    user_id uuid NOT NULL,
    permission_id integer NOT NULL
);


ALTER TABLE admin.users_permissions OWNER TO postgres;

--
-- Name: users_roles; Type: TABLE; Schema: admin; Owner: postgres
--

CREATE TABLE admin.users_roles (
    user_id uuid NOT NULL,
    role_id integer NOT NULL
);


ALTER TABLE admin.users_roles OWNER TO postgres;

--
-- Name: iiko_terminals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.iiko_terminals (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    iiko_id character varying(255) NOT NULL,
    name character varying(100) NOT NULL,
    active boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.iiko_terminals OWNER TO postgres;

--
-- Name: migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    "timestamp" bigint NOT NULL,
    name character varying NOT NULL
);


ALTER TABLE public.migrations OWNER TO postgres;

--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.migrations_id_seq OWNER TO postgres;

--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: typeorm_metadata; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.typeorm_metadata (
    type character varying NOT NULL,
    database character varying,
    schema character varying,
    "table" character varying,
    name character varying,
    value text
);


ALTER TABLE public.typeorm_metadata OWNER TO postgres;

--
-- Name: permissions id; Type: DEFAULT; Schema: admin; Owner: postgres
--

ALTER TABLE ONLY admin.permissions ALTER COLUMN id SET DEFAULT nextval('admin.permissions_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: admin; Owner: postgres
--

ALTER TABLE ONLY admin.roles ALTER COLUMN id SET DEFAULT nextval('admin.roles_id_seq'::regclass);


--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: admin; Owner: postgres
--

COPY admin.permissions (id, slug, description, active, created_at, updated_at) FROM stdin;
1	admin.access.users.read	Read users	t	2022-01-20 12:05:53.65588+00	2022-01-20 12:05:53.65588+00
2	admin.access.users.create	Create users	t	2022-01-20 12:05:53.65588+00	2022-01-20 12:05:53.65588+00
3	admin.access.users.update	Update users	t	2022-01-20 12:05:53.65588+00	2022-01-20 12:05:53.65588+00
4	admin.access.roles.read	Read Roles	t	2022-01-20 12:05:53.65588+00	2022-01-20 12:05:53.65588+00
5	admin.access.roles.create	Create Roles	t	2022-01-20 12:05:53.65588+00	2022-01-20 12:05:53.65588+00
6	admin.access.roles.update	Update Roles	t	2022-01-20 12:05:53.65588+00	2022-01-20 12:05:53.65588+00
7	admin.access.permissions.read	Read permissions	t	2022-01-20 12:05:53.65588+00	2022-01-20 12:05:53.65588+00
8	admin.access.permissions.create	Create permissions	t	2022-01-20 12:05:53.65588+00	2022-01-20 12:05:53.65588+00
9	admin.access.permissions.update	Update permissions	t	2022-01-20 12:05:53.65588+00	2022-01-20 12:05:53.65588+00
10	report.paysystems	Report By Paysystems	t	2022-01-24 04:07:05.741815+00	2022-01-24 04:07:05.741815+00
11	call-center	For call center	t	2022-02-23 11:09:00.493208+00	2022-02-23 11:09:00.493208+00
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: admin; Owner: postgres
--

COPY admin.roles (id, name, active, created_at, updated_at) FROM stdin;
1	Developer	t	2022-01-20 12:05:53.675991+00	2022-01-20 12:05:53.675991+00
2	Admin	t	2022-01-20 12:05:53.675991+00	2022-01-20 12:05:53.675991+00
3	BranchManager	t	2022-01-24 04:07:46.153114+00	2022-01-24 04:07:46.153114+00
4	CallCenter	t	2022-02-23 11:09:33.820544+00	2022-02-23 11:09:33.820544+00
\.


--
-- Data for Name: roles_permissions; Type: TABLE DATA; Schema: admin; Owner: postgres
--

COPY admin.roles_permissions (role_id, permission_id) FROM stdin;
1	1
1	2
1	3
1	4
1	5
1	6
1	7
1	8
1	9
2	1
2	2
2	3
2	4
2	5
2	6
3	10
4	11
4	10
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: admin; Owner: postgres
--

COPY admin.users (id, username, first_name, last_name, password, is_super_user, status, created_at, updated_at, iiko_terminal_id, project) FROM stdin;
e914d4e0-3d67-489b-b3d1-2c9e2198ea20	DemoManager	Demo	Manager	$2a$10$0n7upYrxGzQnJk1fZlLo8ueaKXpmkRDm9HVTglrnjV.zQ7XUSRhFa	f	active	2022-01-24 04:21:24.178881+00	2022-01-24 04:21:24.178881+00	08bc13f0-49bb-4aac-a120-f74ee54eec40	\N
c8704d54-42c1-449e-9c5e-3eacaaa3a2a4	Admin	Admin	Admin	$2a$10$2BZPFnj07wU/zpOXXylBxuaVseSVhcZl4gx8z/hU5El1jhMIlIjpi	t	active	2022-01-20 12:05:53.841091+00	2022-01-25 04:45:05.360985+00	\N	\N
ec32d238-3ac6-49af-bbd6-31f5438eebee	Shahzod	Shahzod	Salimsakov(DEV)	$2a$10$6VlGiHxY.XN0fEMY3OXcZOtAmApx3Q.kZpsf0Xpw2KxO5McvrY.BO	f	active	2022-02-02 14:41:27.103957+00	2022-02-02 14:41:27.103957+00	ebf41c0d-f6e1-46ec-bcd1-d484e7bc1a29	\N
dd1aa518-177a-41ba-b4ae-1c38c85e57b1	Asqar	Asqar	Nosirov	$2a$10$VyoeNLvT7hq0Z1g.IAiIeegkR5NXhgkwAi.f.qi1WfagKJzDEUnOO	f	active	2022-02-02 15:09:25.109193+00	2022-02-02 15:09:25.109193+00	a26e7080-bb52-4587-9350-4d5ec4da1a2f	\N
3abfa212-b3bc-49c6-a020-28125d08319d	testyuriy	Yuri	Mun	$2a$10$9WdTKYQ2V/h2eDRlKU2Nfu3HnfraHp5MNls4yd4aIvcEH39ujAHiW	f	active	2022-02-04 06:53:40.945584+00	2022-02-04 12:55:56.986687+00	2dfb7287-5d91-4474-bc01-3b605c0d89a1	\N
1fcdee52-1846-45a9-a8fd-cee90b279773	Shaxobiddin	Shaxobiddin	Шахобиддин	$2a$10$dAqHHMJ2e44X4QfZ5FfL4OY9VniFtufY6Wy4vecgJrOnqTzLEYLlG	f	active	2022-02-04 13:05:06.474053+00	2022-02-04 13:05:06.474053+00	13fdba0b-7351-4600-8cb5-1863f9bb897d	\N
ba2f4e75-c352-4b29-a755-37c9cbe46cdb	Uktamjon	Uktamjon	Отажонов	$2a$10$5jTo/IK9J1am4upCjdp80.Mv1LczG2bg52cmnkvpJr8k2FJmaB1uG	f	active	2022-02-04 16:08:30.544437+00	2022-02-04 16:08:30.544437+00	16525ee2-9eb1-4a37-8195-0b6c72026c9e	\N
e52941f9-97c6-41f4-8a75-f6334a0cece1	Uktam	Uktam	Ибрагимов	$2a$10$HFHS2qupJKVbVFIPFpKcWuMrlvthOXJOYS6kDa53pESVjo4tGggAa	f	active	2022-02-04 16:14:54.056035+00	2022-02-04 16:14:54.056035+00	d955355b-c4db-3798-0163-14f6b09d00c3	\N
82c8985b-6b9b-4c39-97d7-333d45a1e255	Farrux	Farrux	Тоштемиров	$2a$10$4B9M2z9Z2N0R9LI4d4uzIuI87ouq/8nA5GDjAQxLuIeLsQ/iiELYW	f	active	2022-02-04 16:23:06.115334+00	2022-02-04 16:23:06.115334+00	6e3bd4b5-79fc-467b-901d-1ddf72103fc5	\N
b5f1ed91-35a0-43ec-94ed-17ad66463cef	Bobur	Bobur	Бахтиеров	$2a$10$ryGL6GFzonQkWhuU0SPqw.zJs52LRs4xaesHVDCIs5EeNG5vyEQmy	f	active	2022-02-04 16:31:30.758887+00	2022-02-04 16:31:30.758887+00	8c538ee1-0b98-431e-8c55-63263642d29c	\N
157f5658-76e8-4246-a5e6-946bb036eba8	Ummatullayev	Ilhom	Ummatullayev	$2a$10$DKYtpEvJ469gh2iMvLwDLOx.9BC4q4IwZvAN3EsEcdd9KNBjCecQe	f	active	2022-02-04 16:47:17.002455+00	2022-02-04 16:47:17.002455+00	24448fa6-63e0-46bf-953f-ba24af65e19e	\N
a3e9fe76-8838-400f-a7f4-23cb52bc7bd0	Kosimjon	Kosimjon	Турсуналиев	$2a$10$X0IwvWvteBqLpU9.L0Y2XuL9u/RsrZumsZBphZv.BXl7yzMM6I8He	f	active	2022-02-04 16:56:10.476793+00	2022-02-04 16:56:10.476793+00	5a03dca6-566e-4062-bdf9-9749e3f88e89	\N
4eb269be-1ec7-406a-b2be-ca0f873676ea	Azizbek	Azizbek	Бахтиёров	$2a$10$Ko5rlvJBm/mfWjk.sEpOUOQs/9PfQPwT5Lk8rfbCzbTXnl21hJanq	f	active	2022-02-04 17:00:50.383697+00	2022-02-04 17:00:50.383697+00	684b8b59-c54c-4a6b-a9fd-10475db61aa7	\N
51967565-4529-4069-8910-4ca337e51f78	Sardor	Sardor	Uktamov	$2a$10$CNw/WT9/wALfYzb7.m6IJOa31SlCbK1yHh1dhx/SDkO.FQvM7U556	f	active	2022-02-04 17:02:28.062634+00	2022-02-04 17:02:28.062634+00	3c3e8a5c-2147-4734-82f8-2b37d80ce6e6	\N
9d9b5fee-09df-4b58-90ea-0485b58b4c6f	Nodir	Nodir	Дехканов	$2a$10$FdOYK3LHNi92fYo9kb9.mOC.Uv5gUQJWCDfb8Qj9Kqjn/RnwL91EO	f	active	2022-02-04 17:04:24.481504+00	2022-02-04 17:04:24.481504+00	d955355b-c4db-3798-0163-14f6b09d00c3	\N
3ade2a8b-2dfb-45e3-9d80-009dbd1635e3	Karimjonov	Usufjon	Karimjonov	$2a$10$Zk/K1PQSKcS1JhIXHoVnku7rAv9T8Ctewq1KeWmioT/cx2gdI/p2K	f	inactive	2022-02-04 17:23:45.994943+00	2022-02-08 09:42:36.697384+00	35ac6e67-0b57-4171-8e7a-d31eec3faef9	\N
a24e52e0-47a1-4645-99cd-96a1b1682dd3	Salohiddin	Salohiddin	Xalilov	$2a$10$VCFK5iQzVfEHk1F8mbJNNOy1RbbOImdLmWyIcUqRV6oEiGQNs3EAS	f	active	2022-02-05 05:40:26.853599+00	2022-02-05 05:40:26.853599+00	ebf41c0d-f6e1-46ec-bcd1-d484e7bc1a29	\N
cca514bf-13b5-45fd-ae28-11bc2d03688c	Xondamir	Xondamir	Джаббаров	$2a$10$exqqZZUh.jWZavMcSU0mpeVVw7wAM8B4Nsq7Ef2q0w64BNe1hEY/W	f	active	2022-02-05 05:45:39.882559+00	2022-02-05 05:45:39.882559+00	20a3c8f7-0b75-4fa5-94dd-21427c6cfa4c	\N
27d52f9d-7a6c-454a-abf2-f32b03435061	Boburchopar	Bobur	Обидов	$2a$10$neh5vc49QWyInOlMxB.s/.eKRuyPivHMWSv9i/4MQEtBMP/lg4DDq	f	active	2022-02-05 06:11:54.042613+00	2022-02-05 06:11:54.042613+00	08bc13f0-49bb-4aac-a120-f74ee54eec40	\N
94a077bb-11ee-4616-9650-356b88544012	Firdavs	Firdavs	Хамдамов	$2a$10$ewREJ5rkXeqRCG2zcSAYfO9xnpV8gB7emxy7/ohy25SRc2OwqFZge	f	active	2022-02-05 06:21:40.129243+00	2022-02-05 06:21:40.129243+00	fb46c2bd-9b22-4026-831f-079ff65f3327	\N
c12f906c-fb50-4ba9-b892-18e08695912c	Mirkamol	Mirkamol	Мирсолиев	$2a$10$KKtIBhDBDokTKYZi/ji6qO.caWpvzNFJip8pDYjLg1yU23se0NUNW	f	active	2022-02-05 06:40:38.43593+00	2022-02-05 06:40:38.43593+00	878daca9-c3ab-4f78-a6e4-4aa17be218ac	\N
7047d85b-35db-4fc1-884d-20f522bebb51	Akbar	Akbar	Кудратулаев	$2a$10$Vp5/3BkeNtX1Zatq6.uUhuA5Jqw4f3.kp1ECzHwSS0/c0r4/5tnWa	f	active	2022-02-05 07:08:07.680577+00	2022-02-05 07:08:07.680577+00	8088a57a-59e4-455a-a44c-b8bf4f485832	\N
fe14527d-6b08-45a7-bb5f-a30db26600df	Munisa	Munisa	Курамбаева	$2a$10$Dv8A6pPcLdj1pmw9w04MEuH7t.i0yVCU2atsr7FNQBG61F2a4ffwi	f	active	2022-02-05 07:14:44.381922+00	2022-02-05 07:14:44.381922+00	3db59b95-0b74-46a7-8b10-525cae2ae899	\N
6f5b5a9f-87b6-44b9-b6b2-931ddb2dbf4c	XondamirChopar	Xondamir	Мамиркулов	$2a$10$K4urM/ZtE33V/wJUd2dW6ejw3abZflvFm5iqqmvDir9bh.r8jwADu	f	active	2022-02-05 07:36:24.896523+00	2022-02-05 07:36:24.896523+00	2dfb7287-5d91-4474-bc01-3b605c0d89a1	\N
7502c0a1-0a23-4a99-982f-389af7086001	Muhliyechopar	Muhliye	Кулдашева	$2a$10$vsMyzFM/IiFFEBbvwPZQwuB/nDb5O6p5QTqVTbtreDsYiYVppnwQi	f	active	2022-02-05 07:47:51.238896+00	2022-02-05 07:47:51.238896+00	64e62286-7b6f-468b-9bec-1c087adf7b65	\N
039d2e47-5d61-4a9c-8b5c-c55cd880470e	Ogabekchopar	Ogabek	Одилов	$2a$10$0XXKz/OQop2ynh0VJQySrOqiEmGACZp0/P7PqRMr2KwDhBVmguoJm	f	active	2022-02-05 07:50:24.777807+00	2022-02-05 07:50:24.777807+00	64e62286-7b6f-468b-9bec-1c087adf7b65	\N
24835d38-5581-420c-9719-06ce37ffdaa5	Shazod	Shazod	Qutliyev	$2a$10$gESW7TZUufioCOoX2peGeuDi9gqJfXRbQb/.ZzMDnfh9XYuCUWm.C	f	inactive	2022-02-05 06:35:27.515948+00	2022-03-14 09:06:37.418531+00	2a939b9f-5708-474e-8dbf-a35b55d60f57	\N
41a72b29-192d-46c2-aaa3-38c97ab058ce	UmidLesAiles	Umid	Рахметов	$2a$10$6iSFXPBPZ4fqAy8CqI5YYuXl0NxmwxyPkr/oaiTUBKp6tJE17eoqG	f	active	2022-02-06 15:35:56.280205+00	2022-02-06 15:35:56.280205+00	62b8f053-6dc4-4da3-ae96-cd67dffd76ad	\N
015d0012-519c-422b-b402-3750e446ac7b	Zarnigor	Zarnigor	Абдурасулова	$2a$10$lIZXY/Y/NnWKTIAKwg9OfuO1IJ/vRBV6alKJp4d2lzEZZ5by2it4S	f	active	2022-02-04 16:11:47.610498+00	2022-02-08 09:39:35.547968+00	24448fa6-63e0-46bf-953f-ba24af65e19e	\N
0406843b-6379-4e2b-90f9-ccef647f2bdc	Nodirchopar	Нодирхон 	Муллажонов	$2a$10$/LAxMKVLyDFrdyKHw9Z7uOpmhwN6MckRqQj1N6d9l0jDmMqKeHMXO	f	active	2022-02-11 18:08:29.902278+00	2022-02-11 18:08:29.902278+00	55bb2ff8-2d7b-49ff-915c-7c834e5534ea	chopar
a4785646-c31f-428c-9b53-afe37f410a07	Abdubosit	Abdubosit	Akhmadjanov	$2a$10$q9ObILprT.2IHwLK208dSeGq0HIjneOz6fmI8CvAwifcknpzL4xhK	t	active	2022-02-09 06:45:47.503484+00	2022-02-09 13:29:02.930998+00	\N	les
42859a27-bb04-472f-beb9-288995dfe1f3	Ahmad	Ahmad	Melibaev	$2a$10$7Hd5kMqjuF34FKu57utAqOkkHZpjd2YWhdttLTVCcvDYVWTbxEaUq	t	active	2022-02-09 13:03:03.836191+00	2022-02-09 13:04:25.718276+00	\N	\N
794fe838-0e39-43cb-b614-85ed7e8233d3	Elbek	Elbek	Djabbarov	$2a$10$TIavxcVRYI5Bp4ERfMZ2m.bHpd/F5GO1YiN13Inj1Fe.Ob50i0nZm	t	active	2022-02-09 08:01:14.44988+00	2022-02-09 13:27:23.229821+00	\N	chopar
507db020-88d4-48be-ae04-c7c495988c45	Baxtiyor	Baxtiyor	Gafurof	$2a$10$cXcNuXE955vrEOPIROPTr.rwMU3/gbc4GqaVKLazJbKQHyHCY/uVO	t	active	2022-02-10 10:13:13.181526+00	2022-02-10 10:15:13.808126+00	\N	\N
aaa95cac-202b-4b32-9e45-50b1277d7ab9	Shavkat	Shavkat	Shavkat	$2a$10$J/iJdFuNxYuMy5FQr22KYOR8DlVYDmNAFtMPpaCPx/Wpi1otEM3J2	t	active	2022-02-11 04:41:26.740646+00	2022-02-11 04:47:21.844963+00	\N	\N
ecc0477d-caa8-4b95-b5fd-1f26a1763cc9	Bekzod	Bekzod	Bekzod	$2a$10$.wnqyUiOulL6JFqxptNb3uFG05bD5nB0o5EcfA1srLeY2mRcvKHKe	t	active	2022-02-11 04:41:51.636642+00	2022-02-11 04:47:38.931075+00	\N	\N
aac8e2d8-60a1-4c97-978a-627e664e90d8	Xusanboyles	Хусанбой	Усманов	$2a$10$oZTlyk9BNtn4VtU9Z8BVyutmLVubIvRKNBjJl1TzGmw8rW2pD4s2e	f	active	2022-02-11 18:20:51.44908+00	2022-02-11 18:20:51.44908+00	2842ceb7-1bd5-4c99-9e74-c64ed750ae92	les
8051a755-031f-4fef-b9a3-fa874e1afe37	Xusanboychopar	Хусанбой	Усманов	$2a$10$mxPO/EsSItQF3OORtrMgbOA3DSxxzpZJ2ERC4wx0AQ0OIlvh14z6u	f	active	2022-02-11 18:21:58.749008+00	2022-02-11 18:21:58.749008+00	e0269a8e-786e-468e-9797-c3f15a3b1729	chopar
ba762f97-1fc9-4b56-919c-e4fbbd7842ac	Nodirles	Нодирхон 	Муллажонов	$2a$10$4GoDBzmtEpUZWmVGxu4.X.QWf7YCLcIgkHRSMwoh6/arsOAAcVKGe	f	active	2022-02-11 18:07:34.810724+00	2022-02-11 18:22:26.174131+00	ffa1cb1c-d3fb-4052-9363-4b6e9c1cf10e	chopar
6772b664-160d-4e68-ae60-8a155e351f19	Rustamles	Рустам	Тухтаров	$2a$10$Y4W8uR.bION7CFCxT9SlLeuyRvImHZTaujR6S9yqW1/na05PlEMOq	f	active	2022-02-11 18:24:57.832296+00	2022-02-11 18:24:57.832296+00	2303b2f8-fda3-49d7-82e4-c419c7c2304a	les
35c29273-4078-4b5a-9a9b-ccf5f3dde198	Rustamchopar	Рустам	Тухтаров	$2a$10$jTfJboDWzFng8PtDjA5VR.3bR36HsTr2aXrkp7uwapYHzV/gEq.A2	f	active	2022-02-11 18:25:46.1805+00	2022-02-11 18:25:46.1805+00	a6cceb18-35fb-4bb0-ab4a-af6554f7a886	chopar
0788478c-c1c9-4414-8267-a4eb26857297	Fazliddinles	Фазлиддин	Рахматуллаев	$2a$10$zYSU6DDCxcHTEAbK8agMZ.fLIBbf8cffYQF.ZN8FKMPq2/aFiS2wq	f	active	2022-02-11 18:26:54.632676+00	2022-02-11 18:26:54.632676+00	f4516a18-7670-454c-85fd-84aa634b2c32	les
f34c0588-5db2-4b44-8fcc-89f295784d0d	Fazliddinchopar	Фазлиддин	Рахматуллаев	$2a$10$E5qcBpMpCId.zZuVBcIxr.ZVKY.PziVqMoFzemkSwMtLyFgWW8Ble	f	active	2022-02-11 18:27:44.903895+00	2022-02-11 18:27:44.903895+00	361b4238-8c39-4b14-8d2c-cce182e39557	chopar
c20db538-c271-4946-b94b-a51512184e69	Mirfayz	Mirfayz	Bustanov	$2a$10$OixtmFvUjSRnGqCKHRkwBugeOc/At/NNxwEdH/Bs2YT0qUuHP4jfy	f	active	2022-02-14 17:00:14.82512+00	2022-02-14 17:00:14.82512+00	a450a316-c63d-4932-9d33-cae08c4fae81	les
cf2aa5fc-ab54-472f-8b69-ca574b8609e6	Ravshanjon	Ravshanjon	Акбаров	$2a$10$XnbGMeIWle5H/8GXk2VgvusLpDy/i9Soqou/oecURM2LH6gNf0dtW	f	active	2022-02-21 09:29:09.106586+00	2022-02-21 09:29:09.106586+00	ff9cd72c-7f12-4a9a-b5fe-9b45682b94bd	chopar
2cd685a2-f010-4307-a865-b158e8eb8cb3	Isomiddinchopar	Иброхим	Нуриддинов	$2a$10$t0ME8sNE72b0/pupoXvpOOeSkJxN56XnimxXlBysXgsm9rlQUWVV.	f	active	2022-02-05 07:58:01.090264+00	2022-02-23 10:37:06.428122+00	3db59b95-0b74-46a7-8b10-525cae2ae899	\N
86b166ba-d13c-4d10-b12c-d42b4330cb3d	CallCenter	Call	Center	$2a$10$OLt2vqHJaucN7qM9cUq6xOGsDFFcM415mDzWNX/qtysfs9OLicGwK	t	active	2022-02-23 11:20:52.75863+00	2022-02-23 11:25:29.81859+00	\N	\N
99cc31dd-eb88-479e-b667-ec16d906417e	Ruslan	Ruslan	Quvvatboyev	$2a$10$bZiHctjb9YBHCdCu2DKCYOQz7wbViz.NMaaPrs/YDyNJyQ5b5Man6	f	active	2022-03-14 09:17:10.29069+00	2022-03-14 09:17:10.29069+00	2a939b9f-5708-474e-8dbf-a35b55d60f57	chopar
\.


--
-- Data for Name: users_permissions; Type: TABLE DATA; Schema: admin; Owner: postgres
--

COPY admin.users_permissions (user_id, permission_id) FROM stdin;
e914d4e0-3d67-489b-b3d1-2c9e2198ea20	10
ec32d238-3ac6-49af-bbd6-31f5438eebee	10
dd1aa518-177a-41ba-b4ae-1c38c85e57b1	10
3abfa212-b3bc-49c6-a020-28125d08319d	10
1fcdee52-1846-45a9-a8fd-cee90b279773	10
ba2f4e75-c352-4b29-a755-37c9cbe46cdb	10
015d0012-519c-422b-b402-3750e446ac7b	10
e52941f9-97c6-41f4-8a75-f6334a0cece1	10
82c8985b-6b9b-4c39-97d7-333d45a1e255	10
b5f1ed91-35a0-43ec-94ed-17ad66463cef	10
157f5658-76e8-4246-a5e6-946bb036eba8	10
a3e9fe76-8838-400f-a7f4-23cb52bc7bd0	10
4eb269be-1ec7-406a-b2be-ca0f873676ea	10
51967565-4529-4069-8910-4ca337e51f78	10
9d9b5fee-09df-4b58-90ea-0485b58b4c6f	10
3ade2a8b-2dfb-45e3-9d80-009dbd1635e3	10
a24e52e0-47a1-4645-99cd-96a1b1682dd3	10
cca514bf-13b5-45fd-ae28-11bc2d03688c	10
27d52f9d-7a6c-454a-abf2-f32b03435061	10
94a077bb-11ee-4616-9650-356b88544012	10
24835d38-5581-420c-9719-06ce37ffdaa5	10
c12f906c-fb50-4ba9-b892-18e08695912c	10
7047d85b-35db-4fc1-884d-20f522bebb51	10
fe14527d-6b08-45a7-bb5f-a30db26600df	10
6f5b5a9f-87b6-44b9-b6b2-931ddb2dbf4c	10
7502c0a1-0a23-4a99-982f-389af7086001	10
039d2e47-5d61-4a9c-8b5c-c55cd880470e	10
2cd685a2-f010-4307-a865-b158e8eb8cb3	10
41a72b29-192d-46c2-aaa3-38c97ab058ce	10
a4785646-c31f-428c-9b53-afe37f410a07	10
794fe838-0e39-43cb-b614-85ed7e8233d3	10
42859a27-bb04-472f-beb9-288995dfe1f3	10
507db020-88d4-48be-ae04-c7c495988c45	10
aaa95cac-202b-4b32-9e45-50b1277d7ab9	10
ecc0477d-caa8-4b95-b5fd-1f26a1763cc9	10
ba762f97-1fc9-4b56-919c-e4fbbd7842ac	10
0406843b-6379-4e2b-90f9-ccef647f2bdc	10
aac8e2d8-60a1-4c97-978a-627e664e90d8	10
8051a755-031f-4fef-b9a3-fa874e1afe37	10
6772b664-160d-4e68-ae60-8a155e351f19	10
35c29273-4078-4b5a-9a9b-ccf5f3dde198	10
0788478c-c1c9-4414-8267-a4eb26857297	10
f34c0588-5db2-4b44-8fcc-89f295784d0d	10
c20db538-c271-4946-b94b-a51512184e69	10
cf2aa5fc-ab54-472f-8b69-ca574b8609e6	10
86b166ba-d13c-4d10-b12c-d42b4330cb3d	11
86b166ba-d13c-4d10-b12c-d42b4330cb3d	10
99cc31dd-eb88-479e-b667-ec16d906417e	10
\.


--
-- Data for Name: users_roles; Type: TABLE DATA; Schema: admin; Owner: postgres
--

COPY admin.users_roles (user_id, role_id) FROM stdin;
c8704d54-42c1-449e-9c5e-3eacaaa3a2a4	1
c8704d54-42c1-449e-9c5e-3eacaaa3a2a4	2
e914d4e0-3d67-489b-b3d1-2c9e2198ea20	3
ec32d238-3ac6-49af-bbd6-31f5438eebee	3
dd1aa518-177a-41ba-b4ae-1c38c85e57b1	3
3abfa212-b3bc-49c6-a020-28125d08319d	3
1fcdee52-1846-45a9-a8fd-cee90b279773	3
ba2f4e75-c352-4b29-a755-37c9cbe46cdb	3
015d0012-519c-422b-b402-3750e446ac7b	3
e52941f9-97c6-41f4-8a75-f6334a0cece1	3
82c8985b-6b9b-4c39-97d7-333d45a1e255	3
b5f1ed91-35a0-43ec-94ed-17ad66463cef	3
157f5658-76e8-4246-a5e6-946bb036eba8	3
a3e9fe76-8838-400f-a7f4-23cb52bc7bd0	3
4eb269be-1ec7-406a-b2be-ca0f873676ea	3
51967565-4529-4069-8910-4ca337e51f78	3
9d9b5fee-09df-4b58-90ea-0485b58b4c6f	3
3ade2a8b-2dfb-45e3-9d80-009dbd1635e3	3
a24e52e0-47a1-4645-99cd-96a1b1682dd3	3
cca514bf-13b5-45fd-ae28-11bc2d03688c	3
27d52f9d-7a6c-454a-abf2-f32b03435061	3
94a077bb-11ee-4616-9650-356b88544012	3
24835d38-5581-420c-9719-06ce37ffdaa5	3
c12f906c-fb50-4ba9-b892-18e08695912c	3
7047d85b-35db-4fc1-884d-20f522bebb51	3
fe14527d-6b08-45a7-bb5f-a30db26600df	3
6f5b5a9f-87b6-44b9-b6b2-931ddb2dbf4c	3
7502c0a1-0a23-4a99-982f-389af7086001	3
039d2e47-5d61-4a9c-8b5c-c55cd880470e	3
2cd685a2-f010-4307-a865-b158e8eb8cb3	3
41a72b29-192d-46c2-aaa3-38c97ab058ce	3
a4785646-c31f-428c-9b53-afe37f410a07	3
794fe838-0e39-43cb-b614-85ed7e8233d3	3
42859a27-bb04-472f-beb9-288995dfe1f3	3
507db020-88d4-48be-ae04-c7c495988c45	3
aaa95cac-202b-4b32-9e45-50b1277d7ab9	3
ecc0477d-caa8-4b95-b5fd-1f26a1763cc9	3
ba762f97-1fc9-4b56-919c-e4fbbd7842ac	3
0406843b-6379-4e2b-90f9-ccef647f2bdc	3
aac8e2d8-60a1-4c97-978a-627e664e90d8	3
8051a755-031f-4fef-b9a3-fa874e1afe37	3
6772b664-160d-4e68-ae60-8a155e351f19	3
35c29273-4078-4b5a-9a9b-ccf5f3dde198	3
0788478c-c1c9-4414-8267-a4eb26857297	3
f34c0588-5db2-4b44-8fcc-89f295784d0d	3
c20db538-c271-4946-b94b-a51512184e69	3
cf2aa5fc-ab54-472f-8b69-ca574b8609e6	3
86b166ba-d13c-4d10-b12c-d42b4330cb3d	4
99cc31dd-eb88-479e-b667-ec16d906417e	3
\.


--
-- Data for Name: iiko_terminals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.iiko_terminals (id, iiko_id, name, active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.migrations (id, "timestamp", name) FROM stdin;
1	1597941181251	EnableUuidOssp_1597941181251
2	1602337241496	CreateAdminSchema_1602337241496
3	1602340072549	CreateUserStatusEnum1602340072549
4	1609619240082	createPermissionsTable1609619240082
5	1609619240083	createRolesTable1609619240083
6	1609619240084	CreateRolesPermissionsTable_1609619240084
7	1610321042350	createUsersTable1610321042350
8	1610321079178	createUsersRolesTable1610321079178
9	1610321090667	createUsersPermissionsTable1610321090667
10	1642584430894	iikoTerminals1642584430894
12	1642587050884	iikoTerminalUser1642587050884
13	1644325106601	userToProject1644325106601
\.


--
-- Data for Name: typeorm_metadata; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.typeorm_metadata (type, database, schema, "table", name, value) FROM stdin;
\.


--
-- Name: permissions_id_seq; Type: SEQUENCE SET; Schema: admin; Owner: postgres
--

SELECT pg_catalog.setval('admin.permissions_id_seq', 11, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: admin; Owner: postgres
--

SELECT pg_catalog.setval('admin.roles_id_seq', 4, true);


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.migrations_id_seq', 13, true);


--
-- Name: roles_permissions PK_0cd11f0b35c4d348c6ebb9b36b7; Type: CONSTRAINT; Schema: admin; Owner: postgres
--

ALTER TABLE ONLY admin.roles_permissions
    ADD CONSTRAINT "PK_0cd11f0b35c4d348c6ebb9b36b7" PRIMARY KEY (role_id, permission_id);


--
-- Name: users_permissions PK_7f3736984cd8546a1e418005561; Type: CONSTRAINT; Schema: admin; Owner: postgres
--

ALTER TABLE ONLY admin.users_permissions
    ADD CONSTRAINT "PK_7f3736984cd8546a1e418005561" PRIMARY KEY (user_id, permission_id);


--
-- Name: permissions PK_920331560282b8bd21bb02290df; Type: CONSTRAINT; Schema: admin; Owner: postgres
--

ALTER TABLE ONLY admin.permissions
    ADD CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY (id);


--
-- Name: users PK_a3ffb1c0c8416b9fc6f907b7433; Type: CONSTRAINT; Schema: admin; Owner: postgres
--

ALTER TABLE ONLY admin.users
    ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY (id);


--
-- Name: roles PK_c1433d71a4838793a49dcad46ab; Type: CONSTRAINT; Schema: admin; Owner: postgres
--

ALTER TABLE ONLY admin.roles
    ADD CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY (id);


--
-- Name: users_roles PK_c525e9373d63035b9919e578a9c; Type: CONSTRAINT; Schema: admin; Owner: postgres
--

ALTER TABLE ONLY admin.users_roles
    ADD CONSTRAINT "PK_c525e9373d63035b9919e578a9c" PRIMARY KEY (user_id, role_id);


--
-- Name: roles UQ_648e3f5447f725579d7d4ffdfb7; Type: CONSTRAINT; Schema: admin; Owner: postgres
--

ALTER TABLE ONLY admin.roles
    ADD CONSTRAINT "UQ_648e3f5447f725579d7d4ffdfb7" UNIQUE (name);


--
-- Name: permissions UQ_d090ad82a0e97ce764c06c7b312; Type: CONSTRAINT; Schema: admin; Owner: postgres
--

ALTER TABLE ONLY admin.permissions
    ADD CONSTRAINT "UQ_d090ad82a0e97ce764c06c7b312" UNIQUE (slug);


--
-- Name: users UQ_fe0bb3f6520ee0469504521e710; Type: CONSTRAINT; Schema: admin; Owner: postgres
--

ALTER TABLE ONLY admin.users
    ADD CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE (username);


--
-- Name: iiko_terminals PK_29458434531d1b1385526059a4c; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.iiko_terminals
    ADD CONSTRAINT "PK_29458434531d1b1385526059a4c" PRIMARY KEY (id);


--
-- Name: migrations PK_8c82d7f526340ab734260ea46be; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY (id);


--
-- Name: users_roles FK_1cf664021f00b9cc1ff95e17de4; Type: FK CONSTRAINT; Schema: admin; Owner: postgres
--

ALTER TABLE ONLY admin.users_roles
    ADD CONSTRAINT "FK_1cf664021f00b9cc1ff95e17de4" FOREIGN KEY (role_id) REFERENCES admin.roles(id) ON UPDATE CASCADE;


--
-- Name: roles_permissions FK_337aa8dba227a1fe6b73998307b; Type: FK CONSTRAINT; Schema: admin; Owner: postgres
--

ALTER TABLE ONLY admin.roles_permissions
    ADD CONSTRAINT "FK_337aa8dba227a1fe6b73998307b" FOREIGN KEY (permission_id) REFERENCES admin.permissions(id) ON UPDATE CASCADE;


--
-- Name: users_permissions FK_4de7d0b175f702be3be55270023; Type: FK CONSTRAINT; Schema: admin; Owner: postgres
--

ALTER TABLE ONLY admin.users_permissions
    ADD CONSTRAINT "FK_4de7d0b175f702be3be55270023" FOREIGN KEY (user_id) REFERENCES admin.users(id) ON UPDATE CASCADE;


--
-- Name: roles_permissions FK_7d2dad9f14eddeb09c256fea719; Type: FK CONSTRAINT; Schema: admin; Owner: postgres
--

ALTER TABLE ONLY admin.roles_permissions
    ADD CONSTRAINT "FK_7d2dad9f14eddeb09c256fea719" FOREIGN KEY (role_id) REFERENCES admin.roles(id) ON UPDATE CASCADE;


--
-- Name: users_permissions FK_b09b9a210c60f41ec7b453758e9; Type: FK CONSTRAINT; Schema: admin; Owner: postgres
--

ALTER TABLE ONLY admin.users_permissions
    ADD CONSTRAINT "FK_b09b9a210c60f41ec7b453758e9" FOREIGN KEY (permission_id) REFERENCES admin.permissions(id) ON UPDATE CASCADE;


--
-- Name: users_roles FK_e4435209df12bc1f001e5360174; Type: FK CONSTRAINT; Schema: admin; Owner: postgres
--

ALTER TABLE ONLY admin.users_roles
    ADD CONSTRAINT "FK_e4435209df12bc1f001e5360174" FOREIGN KEY (user_id) REFERENCES admin.users(id) ON UPDATE CASCADE;


--
-- PostgreSQL database dump complete
--

