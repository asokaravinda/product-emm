INSERT INTO PLATFORMS
(
  NAME,
  DESCRIPTION,
  TYPE,
  TYPE_NAME,
  COLOR
)
VALUES
(
  'BeagleBone',
  'BeagleBone',
  '3',
  'iot',
  '#DE2339'
);


CREATE TABLE DEVICE_TOKENS
(
   ID           INTEGER       DEFAULT (NEXT VALUE FOR PUBLIC.SYSTEM_SEQUENCE_0BC01E35_2472_4F9B_8EF3_0D42148998DF) NOT NULL,
   USERNAME         VARCHAR(45)   DEFAULT NULL,
   TENANT_ID  VARCHAR(45)   DEFAULT NULL,
   TOKEN VARCHAR(45)   DEFAULT NULL,
   TOKEN_EXPIRY_DATE DATETIME  DEFAULT NULL,
   TOKEN_ADDED_DATE DATETIME  DEFAULT NULL,
   TOKEN_STATUS VARCHAR(45)   DEFAULT NULL
);

ALTER TABLE DEVICE_TOKENS
   ADD CONSTRAINT pk_ID
   PRIMARY KEY (ID);
   
ALTER TABLE DEVICE_TOKENS   
   ADD CONSTRAINT uq_TOKEN
   UNIQUE ( TOKEN );


CREATE TABLE UNCLAIMED_DEVICES
(
   ID            INTEGER         DEFAULT (NEXT VALUE FOR PUBLIC.SYSTEM_SEQUENCE_656F439A_3D51_419E_B669_31C91216FD63) NOT NULL,
   PLATFORM_ID   INTEGER         NOT NULL,
   OS_VERSION    VARCHAR(45)     DEFAULT NULL,
   PROPERTIES    CLOB,
   CREATED_DATE  TIMESTAMP       DEFAULT NULL,
   STATUS        VARCHAR(10)     DEFAULT NULL,
   VENDOR        VARCHAR(11)     DEFAULT NULL,
   MAC           VARCHAR(100)    DEFAULT NULL
);

ALTER TABLE UNCLAIMED
   ADD CONSTRAINT pk_devices
   PRIMARY KEY (ID);
