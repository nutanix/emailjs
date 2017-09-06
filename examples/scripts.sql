/**
 * Replace your email address at <name@domain.com>
 * Choose a schema of your choice by replacing 'mail_schema'
 */

/* Optional 
CREATE SCHEMA mail_schema;
*/

CREATE SEQUENCE mail_schema.mail_archive_eid_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    CACHE 1;

CREATE SEQUENCE mail_schema.mail_outbox_eid_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    CACHE 1;

CREATE TABLE mail_schema.mail_archive
(
    eid integer NOT NULL DEFAULT nextval('mail_schema.mail_archive_eid_seq'::regclass),
    eventname text COLLATE pg_catalog."default",
    template text COLLATE pg_catalog."default",
    content json,
    subject text COLLATE pg_catalog."default",
    "from" text COLLATE pg_catalog."default",
    "to" text COLLATE pg_catalog."default",
    cc text COLLATE pg_catalog."default",
    bcc text COLLATE pg_catalog."default",
    html text COLLATE pg_catalog."default",
    text text COLLATE pg_catalog."default",
    attachments json,
    error text COLLATE pg_catalog."default",
    attempts integer,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    CONSTRAINT mail_archive_pkey PRIMARY KEY (eid)
);

CREATE TABLE mail_schema.mail_outbox
(
    eid integer NOT NULL DEFAULT nextval('mail_schema.mail_outbox_eid_seq'::regclass),
    eventname text COLLATE pg_catalog."default",
    template text COLLATE pg_catalog."default",
    content json,
    subject text COLLATE pg_catalog."default",
    "from" text COLLATE pg_catalog."default",
    "to" text COLLATE pg_catalog."default",
    cc text COLLATE pg_catalog."default",
    bcc text COLLATE pg_catalog."default",
    html text COLLATE pg_catalog."default",
    text text COLLATE pg_catalog."default",
    attachments json,
    error text COLLATE pg_catalog."default",
    attempts integer,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    CONSTRAINT mail_outbox_pkey PRIMARY KEY (eid)
);

CREATE TABLE mail_schema.mail_rules
(
    ruleid text COLLATE pg_catalog."default",
    eventname text COLLATE pg_catalog."default",
    enabled boolean,
    template text COLLATE pg_catalog."default",
    "from" text COLLATE pg_catalog."default",
    "to" text COLLATE pg_catalog."default",
    cc text COLLATE pg_catalog."default",
    bcc text COLLATE pg_catalog."default",
    subject text COLLATE pg_catalog."default",
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone
);

insert into mail_schema.mail_rules values(1,'SUCCEED_RULE',true,'welcomeemail',null,'<name@domain.com>',null,null,'My Subject', NOW(),NOW());
insert into mail_schema.mail_rules values(2,'FAILED_RULE',true,'welcomeemail',null,'<name@domain.com>',null,null,'My Subject', NOW(),NOW());

