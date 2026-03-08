# MindMate AI: Crisis Detection & Escalation Playbook

## CRITICAL SAFETY DOCUMENTATION

**Version:** 1.0  
**Last Updated:** 2025  
**Classification:** Safety-Critical  
**Purpose:** Comprehensive protocols for detecting, assessing, and escalating mental health crises

---

## TABLE OF CONTENTS

1. [Clinical Suicide Risk Assessment Tools](#1-clinical-suicide-risk-assessment-tools)
2. [Legal Requirements for Mandatory Reporting](#2-legal-requirements-for-mandatory-reporting)
3. [Global Crisis Hotlines Directory](#3-global-crisis-hotlines-directory)
4. [Telehealth Platform Crisis Handling](#4-telehealth-platform-crisis-handling)
5. [Crisis Detection & Escalation Protocol](#5-crisis-detection--escalation-protocol)
6. [Implementation Guidelines for AI Systems](#6-implementation-guidelines-for-ai-systems)

---

## 1. CLINICAL SUICIDE RISK ASSESSMENT TOOLS

### 1.1 Columbia Protocol (C-SSRS)

**Full Name:** Columbia-Suicide Severity Rating Scale  
**Developer:** Columbia Lighthouse Project  
**Purpose:** Screen for suicide risk through simple, plain-language questions

#### Screening Questions (Screener Version)

**All patients are asked Questions 1 and 2:**

| # | Question | Risk Level if YES |
|---|----------|-------------------|
| 1 | Have you wished you were dead or wished you could go to sleep and not wake up? | Low |
| 2 | Have you actually had any thoughts of killing yourself? | Low |

**If YES to Question 2, ask Questions 3-6:**

| # | Question | Risk Level if YES |
|---|----------|-------------------|
| 3 | Have you been thinking about how you might do this? | Moderate |
| 4 | Have you had these thoughts and had some intention of acting on them? | High |
| 5 | Have you started to work out or worked out the details of how to kill yourself? Do you intend to carry out this plan? | High |
| 6 | Have you ever done anything, started to do anything, or prepared to do anything to end your life? | High |

#### Scoring Interpretation

| Score/Risk Level | Criteria | Action Required |
|------------------|----------|-----------------|
| **0 - No Risk** | All "No" responses | None; routine monitoring |
| **1-2 - Low Risk** | YES only to Questions 1 or 2 | Safety planning recommended |
| **3 - Moderate Risk** | YES to Question 3 | Mandatory safety plan; referral to clinician |
| **4-6 - High Risk** | YES to Questions 4, 5, or 6 | Immediate intervention; emergency protocols |

#### Key Clinical Notes
- C-SSRS does NOT provide numerical scores but categorizes risk levels
- Any YES to Questions 4-6 indicates HIGH RISK requiring immediate action
- If patient answers NO to Question 2, skip to Question 6 for behavior assessment
- Tool validated for ages 13+

---

### 1.2 PHQ-9 (Patient Health Questionnaire-9)

**Purpose:** Screen for depression severity and suicidal ideation  
**Timeframe:** Past 2 weeks  
**Items:** 9 questions  
**Scoring:** 0-3 per item (Total: 0-27)

#### The 9 Items

Over the last 2 weeks, how often have you been bothered by:

1. Little interest or pleasure in doing things
2. Feeling down, depressed, or hopeless
3. Trouble falling or staying asleep, or sleeping too much
4. Feeling tired or having little energy
5. Poor appetite or overeating
6. Feeling bad about yourself or that you are a failure
7. Trouble concentrating
8. Moving or speaking slowly or being fidgety/restless
9. **Thoughts that you would be better off dead or of hurting yourself**

#### Response Scale
- 0 = Not at all
- 1 = Several days
- 2 = More than half the days
- 3 = Nearly every day

#### Severity Interpretation

| Total Score | Severity Level | Treatment Actions |
|-------------|----------------|-------------------|
| 0-4 | None-Minimal | None |
| 5-9 | Mild | Watchful waiting; repeat PHQ-9 at follow-up |
| 10-14 | Moderate | Treatment plan; consider counseling/pharmacotherapy |
| 15-19 | Moderately Severe | Active treatment with pharmacotherapy and/or psychotherapy |
| 20-27 | Severe | Immediate pharmacotherapy; expedited referral to specialist |

#### CRITICAL: Question 9 Protocol

**Question 9 screens for suicidal ideation.**

| Response | Action Required |
|----------|-----------------|
| ANY score > 0 on Question 9 | Immediate suicide risk assessment required |
| Score 1 (Several days) | Clinical follow-up within 24-48 hours |
| Score 2-3 (More than half days/Nearly every day) | Immediate safety assessment; consider emergency intervention |

---

### 1.3 GAD-7 (Generalized Anxiety Disorder-7)

**Purpose:** Screen for anxiety severity  
**Timeframe:** Past 2 weeks  
**Items:** 7 questions  
**Scoring:** 0-3 per item (Total: 0-21)

#### The 7 Items

Over the last 2 weeks, how often have you been bothered by:

1. Feeling nervous, anxious, or on edge
2. Not being able to stop or control worrying
3. Worrying too much about different things
4. Trouble relaxing
5. Being so restless that it is hard to sit still
6. Becoming easily annoyed or irritable
7. Feeling afraid, as if something awful might happen

#### Severity Interpretation

| Total Score | Severity Level | Action Required |
|-------------|----------------|-----------------|
| 0-4 | No to Minimal | None |
| 5-9 | Mild | Monitor; consider lifestyle interventions |
| 10-14 | Moderate | Further evaluation warranted; treatment consideration |
| 15-21 | Severe | Active treatment recommended |

#### Clinical Cut-off
- **Score >= 10:** Reasonable cut-point for identifying probable GAD
- **Sensitivity:** 89% at cut-off of 10
- **Specificity:** 82% at cut-off of 10

---

### 1.4 Beck Depression Inventory-II (BDI-II)

**Purpose:** Gold standard for assessing depression severity  
**Items:** 21 questions  
**Scoring:** 0-3 per item (Total: 0-63)  
**Timeframe:** Past 2 weeks, including today  
**Copyright:** Pearson Assessments (requires purchase for legal use)

#### Sample Item Structure (Item 1 - Sadness)

- 0 = I do not feel sad
- 1 = I feel sad much of the time
- 2 = I am sad all the time
- 3 = I am so sad or unhappy that I can't stand it

#### Severity Classification

| Total Score | Severity Level | Clinical Significance |
|-------------|----------------|----------------------|
| 0-13 | Minimal | Normal mood variations |
| 14-19 | Mild | Clinically significant; may impact quality of life |
| 20-28 | Moderate | Multiple symptoms affecting functioning |
| 29-63 | Severe | Significant distress; functional impairment |

#### CRITICAL: Item 9 - Suicidal Thoughts

| Score | Interpretation | Action Required |
|-------|----------------|-----------------|
| 0 | No suicidal thoughts | None specific |
| 1 | Thoughts but would not carry out | Clinical monitoring |
| 2 | Would like to kill self | Immediate risk assessment |
| 3 | Would kill self if had chance | Emergency intervention |

**ANY score > 0 on Item 9 requires immediate suicide risk assessment and safety planning.**

#### Clinical Cut-offs
- **Score >= 14:** Suggests clinically significant depression
- **Score >= 20:** Moderate-to-severe; treatment intervention needed
- **Score >= 29:** Severe; intensive treatment and close monitoring

#### Meaningful Change Indicators
- **>= 5 point reduction:** Clinically meaningful improvement
- **Score < 14:** Common remission criterion
- **50% reduction:** Often used as "responder" criterion

---

## 2. LEGAL REQUIREMENTS FOR MANDATORY REPORTING

### 2.1 United States

#### Duty to Warn/Protect (Tarasoff Obligations)

**Legal Foundation:** Tarasoff v. Regents of University of California (1976)

**Key Principle:** Mental health professionals have a duty to protect identifiable victims from credible threats of violence.

| State Category | Description | States |
|----------------|-------------|--------|
| **Mandatory Duty** | Statutorily required to warn/protect | CA, NY, TX, FL, IL, PA, OH, GA, NC, MI, NJ, VA, WA, AZ, MA, IN, MO, MD, WI, CO, MN, SC, AL, LA, KY, OR, OK, CT, UT, IA, NV, AR, MS, KS, NM, NE, WV, ID, HI, NH, ME, MT, DE, RI, SD, ND, VT, AK, WY, DC |
| **Permissive Duty** | May disclose but not required | Some states allow discretion |
| **No Guidance** | No specific statute or case law | Few remaining |

#### What Triggers Duty to Warn/Protect

| Factor | Requirement |
|--------|-------------|
| **Threat Specificity** | Must be specific threat against identifiable victim(s) |
| **Imminence** | Danger must be imminent or foreseeable |
| **Credibility** | Threat must be credible and serious |
| **Identifiability** | Victim(s) must be reasonably identifiable |

#### Suicide Risk Reporting

| Situation | Mandatory Reporting? | Action Required |
|-----------|---------------------|-----------------|
| Adult suicidal ideation | NO (generally) | Clinical judgment; safety planning |
| Adult with imminent suicide plan | NO (but ethical duty to intervene) | Emergency intervention; hospitalization if needed |
| Child/Adolescent suicidal ideation | Varies by state | Follow state child protection laws |
| Involuntary commitment criteria | Varies by state | Follow state mental health hold laws |

#### Child Abuse Reporting (Mandatory in ALL States)

| Requirement | Details |
|-------------|---------|
| **Who must report** | Mental health professionals, teachers, medical personnel, etc. |
| **What to report** | Reasonable suspicion of abuse/neglect |
| **Timeline** | Immediately or within 24-48 hours (varies by state) |
| **Penalty for failure** | Criminal charges, fines, loss of license |

---

### 2.2 United Kingdom

#### Key Legal Principles

**Suicide Decriminalization:** Suicide was decriminalized in England and Wales in 1961.

| Aspect | Legal Status |
|--------|--------------|
| **Mandatory reporting of suicide risk** | NO general legal duty |
| **Aiding/abetting suicide** | Illegal (up to 14 years imprisonment) |
| **Duty of care** | Professional obligation to take "reasonable steps" |

#### Confidentiality and Breach

**When Confidentiality May Be Breached:**

| Situation | Legal Basis | Action |
|-----------|-------------|--------|
| Terrorism | Terrorism Act 2000 | Mandatory reporting |
| Money laundering | Proceeds of Crime Act 2002 | Mandatory reporting |
| Child safeguarding | Children Act 1989 | Professional/ethical duty |
| Imminent harm to others | Public interest | Permitted disclosure |
| Suicide risk | Professional duty of care | Clinical judgment |

#### Professional Requirements (BACP Guidelines)

1. **Documentation:** Must document risk assessment and rationale for decisions
2. **Contractual Limits:** Must inform clients of confidentiality limits upfront
3. **Supervision:** Should discuss high-risk cases in supervision
4. **Clinical Will:** Required by most ethical bodies for sole practitioners

#### Key Quote from BACP Guidelines:

> "There is no general duty to rescue in British law... counsellors need to be explicit about reserving the power to breach confidentiality for a suicidal adult client. To do so without explicit agreement may constitute an actionable breach of confidence."

---

### 2.3 India

#### Mental Healthcare Act 2017 (MHCA)

**Section 115 - Decriminalization of Attempted Suicide:**

> "Any person who attempts to commit suicide shall be presumed, unless proved otherwise, to have severe stress and shall not be tried and punished under the said Code."

| Aspect | Legal Status |
|--------|--------------|
| **Attempted suicide** | Decriminalized (presumed severe stress) |
| **Abetment of suicide** | Still criminal (Section 306 IPC) |
| **Mandatory reporting** | No general requirement for clinicians |
| **Government duty** | Must provide care, treatment, rehabilitation |

#### Reporting Requirements

| Situation | Requirement |
|-----------|-------------|
| Suicide attempt in hospital | Medico-legal case may be registered |
| Student suicide on campus | Mandatory FIR registration (Supreme Court 2025) |
| Suspected abetment | Must report to police |

#### Key Helpline: KIRAN
- **Number:** 1800-599-0019
- **Availability:** 24/7
- **Languages:** 13 languages (Hindi, English, Tamil, Telugu, etc.)
- **Services:** Early screening, first aid, psychological support, referral

---

### 2.4 Canada

#### Provincial Variations

**Ontario (PHIPA - Personal Health Information Protection Act):**

| Situation | Disclosure Permitted? |
|-----------|----------------------|
| Reasonable belief of serious self-harm | YES - without consent |
| Reasonable belief of harm to others | YES - without consent |
| Child abuse/neglect | MANDATORY reporting |

#### Duty to Warn/Protect

**R v. Chatillon (2023 SCC 7):** Supreme Court case balancing public safety and confidentiality.

| Requirement | Details |
|-------------|---------|
| **Clear risk** | To identifiable person or group |
| **Serious harm** | Bodily harm or death |
| **Imminent danger** | Risk is immediate |

#### Mandatory Reporting by Province

| Province | Child Abuse | Vulnerable Adults | Suicide Risk |
|----------|-------------|-------------------|--------------|
| Ontario | Mandatory | Permissive | Permissive |
| British Columbia | Mandatory | Permissive | Permissive |
| Alberta | Mandatory | Permissive | Permissive |
| Quebec | Mandatory | Permissive | Permissive |
| All provinces | YES | Varies | Clinical judgment |

---

### 2.5 Australia

#### Mandatory Reporting Requirements

**NSW Psychologist Obligations (Representative of State Laws):**

| Legislation | Reporting Requirement |
|-------------|----------------------|
| Children and Young Persons (Care and Protection) Act 1998 | Mandatory child abuse reporting |
| Health Practitioner Regulation National Law | Mandatory notifications for impaired practitioners |
| NSW Crimes Act 1900 | Reporting certain criminal activities |

#### APS Code of Ethics (2018)

**Key Ethical Guidelines:**
- Ethical Guidelines Relating to Clients at Risk of Suicide (2014)
- Ethical Guidelines on Confidentiality (2015)
- Ethical Guidelines on Working with Clients Where There is Risk of Serious Harm to Others (2013)

#### Suicide Risk Protocol

| Situation | Professional Obligation |
|-----------|------------------------|
| Adult suicidal ideation | Clinical judgment; safety planning |
| Child/adolescent at risk | Mandatory reporting obligations |
| Imminent risk | Duty of care to intervene |

#### Key Australian Hotlines
- **Lifeline:** 13 11 14 (24/7)
- **Beyond Blue:** 1300 22 4636
- **Kids Helpline:** 1800 55 1800

---

## 3. GLOBAL CRISIS HOTLINES DIRECTORY

### 3.1 North America

| Country | Service | Number | Hours | Languages |
|---------|---------|--------|-------|-----------|
| **USA** | 988 Suicide & Crisis Lifeline | 988 (call/text) | 24/7 | English, Spanish |
| **USA** | Crisis Text Line | Text HOME to 741741 | 24/7 | English |
| **USA** | Trevor Project (LGBTQ+) | 1-866-488-7386 | 24/7 | English |
| **Canada** | Talk Suicide Canada | 1-833-456-4566 | 24/7 | English, French |
| **Canada** | Crisis Text Line | Text 45645 | 4pm-midnight ET | English, French |
| **Canada** | Kids Help Phone | 1-800-668-6868 | 24/7 | English, French |
| **Mexico** | Consejo Ciudadano | 55-5533-5533 | 24/7 | Spanish |

### 3.2 Europe

| Country | Service | Number | Hours | Languages |
|---------|---------|--------|-------|-----------|
| **UK** | Samaritans | 116 123 | 24/7 | English |
| **UK** | Shout (Text) | Text SHOUT to 85258 | 24/7 | English |
| **UK** | CALM | 0800 58 58 58 | 5pm-midnight | English |
| **France** | Suicide Ecoute | 01 45 39 40 00 | 24/7 | French |
| **France** | 3114 | 3114 | 24/7 | French |
| **Germany** | TelefonSeelsorge | 0800 111 0 111 | 24/7 | German |
| **Germany** | TelefonSeelsorge | 0800 111 0 222 | 24/7 | German |
| **Spain** | Teléfono de la Esperanza | 717 003 717 | 24/7 | Spanish |
| **Italy** | Samaritans Onlus | 800 860022 | 24/7 | Italian |
| **Netherlands** | Stichting 113 | 0900-0113 | 24/7 | Dutch |
| **Belgium** | Zelfmoordlijn | 1813 | 24/7 | Dutch, French |
| **Switzerland** | Die Dargebotene Hand | 143 | 24/7 | German, French, Italian |
| **Sweden** | Mind Självmordslinjen | 90101 | 24/7 | Swedish |
| **Norway** | Mental Helse | 116 123 | 24/7 | Norwegian |
| **Denmark** | Livslinien | 70 201 201 | Daily | Danish |
| **Austria** | Telefonseelsorge | 142 | 24/7 | German |
| **Ireland** | Samaritans | 116 123 | 24/7 | English |
| **Portugal** | SOS Voz Amiga | 21 354 45 45 | 4pm-midnight | Portuguese |
| **Russia** | EMERCOM Line | +7 (495) 989-50-50 | 24/7 | Russian |

### 3.3 Asia-Pacific

| Country | Service | Number | Hours | Languages |
|---------|---------|--------|-------|-----------|
| **Australia** | Lifeline | 13 11 14 | 24/7 | English |
| **Australia** | Beyond Blue | 1300 22 4636 | 24/7 | English |
| **Australia** | Kids Helpline | 1800 55 1800 | 24/7 | English |
| **New Zealand** | Lifeline Aotearoa | 0800 543 354 | 24/7 | English |
| **New Zealand** | 1737 | Call/Text 1737 | 24/7 | English |
| **India** | KIRAN (Govt) | 1800-599-0019 | 24/7 | 13 languages |
| **India** | AASRA | 91-9820466726 | 24/7 | English, Hindi |
| **India** | Vandrevala Foundation | 9999-666-555 | 24/7 | English, Hindi |
| **India** | iCall (TISS) | 022-25521111 | Mon-Sat 8am-10pm | English, Hindi |
| **Japan** | TELL Lifeline | 03-5774-0992 | Daily | English, Japanese |
| **Japan** | Inochi no Denwa | 0570-783-556 | Daily | Japanese |
| **China** | Lifeline Shanghai | 400-821-1215 | Daily | Chinese, English |
| **China** | Beijing Suicide Research | 800-810-1117 | 24/7 | Chinese |
| **South Korea** | Korea Suicide Prevention | 1393 | 24/7 | Korean |
| **South Korea** | Lifeline Korea | (02) 715-8600 | 24/7 | Korean |
| **Singapore** | Samaritans of Singapore | 1767 | 24/7 | English |
| **Hong Kong** | Samaritan Befrienders | 2389-2222 | 24/7 | Cantonese, English |
| **Hong Kong** | The Samaritans | 2896-0000 | 24/7 | English |
| **Philippines** | NCMH Crisis Hotline | 1553 / 0917-899-8727 | 24/7 | English, Filipino |
| **Philippines** | HOPELINE | 2919 (Globe/TM) | 24/7 | English, Filipino |
| **Malaysia** | Befrienders KL | 03-7627-2929 | Daily | English, Malay |
| **Thailand** | Mental Health Hotline | 1323 | 24/7 | Thai |
| **Indonesia** | Mental Health Hotline | 119 ext 8 | 24/7 | Indonesian |
| **Taiwan** | Taiwan Suicide Prevention | 1925 | 24/7 | Mandarin |
| **Vietnam** | Vietnam National Hotline | 0243-574-5786 | Business hours | Vietnamese |

### 3.4 Latin America

| Country | Service | Number | Hours | Languages |
|---------|---------|--------|-------|-----------|
| **Brazil** | CVV | 188 | 24/7 | Portuguese |
| **Brazil** | SAMU Emergency | 192 | 24/7 | Portuguese |
| **Argentina** | Centro de Asistencia al Suicida | 135 (Buenos Aires) | 24/7 | Spanish |
| **Argentina** | CAS Nacional | (011) 5275-1135 | 24/7 | Spanish |
| **Chile** | Teléfono de la Esperanza | (00 56 42) 22 12 00 | 24/7 | Spanish |
| **Chile** | Todo Mejora (LGBTQ+) | +56 9 5903 8388 | Daily | Spanish |
| **Colombia** | Teléfono de la Esperanza | (57-1) 323-2425 | 24/7 | Spanish |
| **Mexico** | SAPTEL | 800-472-7835 | 24/7 | Spanish |
| **Mexico** | Linea de la Vida | 800-911-2000 | 24/7 | Spanish |
| **Peru** | Telefono de la Esperanza | (01) 273-8026 | 24/7 | Spanish |

### 3.5 Africa & Middle East

| Country | Service | Number | Hours | Languages |
|---------|---------|--------|-------|-----------|
| **South Africa** | SADAG | 0800-567-567 | 24/7 | English |
| **South Africa** | Lifeline SA | 0861-322-322 | 24/7 | English |
| **Nigeria** | SURPIN | 0908-021-7555 | 24/7 | English |
| **Kenya** | Red Cross Support | 1199 | 24/7 | English, Swahili |
| **Ghana** | Mental Health Authority | 2332-444-71279 | Business hours | English |
| **Egypt** | Mental Health Hotline | 131114 | 24/7 | Arabic |
| **Israel** | ERAN | 1201 | 24/7 | Hebrew, English |
| **Lebanon** | Embrace Lifeline | 1564 | 24/7 | Arabic, English |
| **UAE** | Mental Health Hotline | 800-46342 | 24/7 | Arabic, English |
| **Saudi Arabia** | Mental Health Hotline | 920-033-360 | Business hours | Arabic |
| **Iran** | Crisis Line | 123 | 24/7 | Persian |
| **Turkey** | Mental Health Hotline | 182 | 24/7 | Turkish |

### 3.6 Emergency Numbers by Country

| Country | Police | Medical | Fire | Emergency |
|---------|--------|---------|------|-----------|
| **USA** | 911 | 911 | 911 | 911 |
| **UK** | 999 | 999 | 999 | 999/112 |
| **Canada** | 911 | 911 | 911 | 911 |
| **Australia** | 000 | 000 | 000 | 000 |
| **New Zealand** | 111 | 111 | 111 | 111 |
| **India** | 100/112 | 108/112 | 101/112 | 112 |
| **EU Countries** | 112 | 112 | 112 | 112 |
| **Japan** | 110 | 119 | 119 | 110/119 |
| **China** | 110 | 120 | 119 | 110 |
| **Brazil** | 190 | 192 | 193 | 192 |
| **Mexico** | 911 | 911 | 911 | 911 |
| **South Africa** | 10111 | 10177 | 10177 | 10111 |

---

## 4. TELEHEALTH PLATFORM CRISIS HANDLING

### 4.1 Legal Framework for Telehealth Crisis Management

#### United States Requirements

| Requirement | Description |
|-------------|-------------|
| **HIPAA Compliance** | Video platforms must be HIPAA-compliant with BAA |
| **State Licensure** | Provider must be licensed in client's state |
| **PSYPACT** | Facilitates cross-state telepsychology for participating states |
| **Informed Consent** | Must address telehealth-specific risks and limits |
| **Emergency Protocol** | Required plan for client location and crisis response |

#### Documentation Requirements

| Element | Required Documentation |
|---------|----------------------|
| **Session details** | Modality, locations, duration |
| **Crisis plan** | Emergency contacts, local resources |
| **Risk assessment** | Suicide screening results |
| **Safety plan** | Documented and updated regularly |
| **Follow-up** | Plan for between-session contact |

### 4.2 Crisis Detection in Telehealth Settings

#### Screening Tools for Telehealth

| Tool | Format | Administration Time | Suitability |
|------|--------|---------------------|-------------|
| **ASQ** | Verbal/Written | 20 seconds | All ages, telehealth-adapted |
| **C-SSRS** | Verbal | 2-6 minutes | Ages 13+, validated for telehealth |
| **PHQ-9** | Digital form | 2-3 minutes | Adults, easily integrated |
| **GAD-7** | Digital form | 1-2 minutes | Adults, easily integrated |

#### Telehealth Safety Planning Components

1. **Warning Signs Identification**
2. **Internal Coping Strategies**
3. **Social Support Contacts**
4. **Professional Resources**
5. **Means Restriction**
6. **Emergency Numbers**

### 4.3 Crisis Response Protocol for Telehealth

#### Immediate Danger Assessment

| Step | Action |
|------|--------|
| 1 | Assess immediate danger level |
| 2 | Identify client's exact location |
| 3 | Determine if client can be detained/intervened |
| 4 | Contact emergency services if needed |
| 5 | Remain connected with client during triage |

#### Emergency Contact Protocol

```
IF imminent risk identified:
    1. Keep client on video/audio connection
    2. Identify client's location
    3. Call local emergency services (911/local equivalent)
    4. Provide client's address and situation
    5. Stay connected until help arrives
    6. Document all actions taken
```

### 4.4 Licensed Platform Requirements

#### Crisis Escalation Pathway

| Risk Level | Response | Timeline |
|------------|----------|----------|
| **Low** | Safety planning, routine follow-up | Next scheduled session |
| **Moderate** | Enhanced safety plan, increased contact | Within 24-48 hours |
| **High** | Immediate intervention, emergency services | Immediate |

#### Platform Safety Features (Industry Best Practice)

Based on analysis of Wysa, Woebot, Ginger, and similar platforms:

| Feature | Implementation |
|---------|----------------|
| **Real-time risk detection** | AI monitoring for crisis keywords and sentiment |
| **Crisis classification model** | Multi-layer detection system |
| **Emergency module** | Automatic display of crisis resources |
| **Human oversight** | Clinician review of flagged conversations |
| **Escalation protocol** | Clear pathway to human intervention |
| **Documentation** | Audit logs of all safety interventions |

---

## 5. CRISIS DETECTION & ESCALATION PROTOCOL

### 5.1 Risk Stratification Framework

#### Level 0: No Risk (Green)

| Indicator | Criteria |
|-----------|----------|
| C-SSRS | All "No" responses |
| PHQ-9 Q9 | Score = 0 |
| BDI-II Item 9 | Score = 0 |
| Clinical presentation | No indicators of distress |

**Action:** Routine monitoring, standard care

---

#### Level 1: Mild Risk (Yellow)

| Indicator | Criteria |
|-----------|----------|
| C-SSRS | YES to Questions 1 or 2 only |
| PHQ-9 Q9 | Score = 1 (Several days) |
| BDI-II Item 9 | Score = 1 (Thoughts but wouldn't act) |
| Clinical presentation | Passive ideation, no plan |

**Action:**
- [ ] Complete safety planning
- [ ] Schedule follow-up within 1 week
- [ ] Provide crisis resources
- [ ] Document risk assessment
- [ ] Consider referral to mental health professional

---

#### Level 2: Moderate Risk (Orange)

| Indicator | Criteria |
|-----------|----------|
| C-SSRS | YES to Question 3 (thinking about how) |
| PHQ-9 Q9 | Score = 2 (More than half the days) |
| BDI-II Item 9 | Score = 2 (Would like to kill self) |
| Clinical presentation | Active ideation with method consideration |

**Action:**
- [ ] Immediate safety planning required
- [ ] Contact within 24-48 hours
- [ ] Refer to mental health professional
- [ ] Involve support system if possible
- [ ] Document detailed risk assessment
- [ ] Consider means restriction counseling
- [ ] Develop crisis response plan

---

#### Level 3: High Risk (Red)

| Indicator | Criteria |
|-----------|----------|
| C-SSRS | YES to Questions 4, 5, or 6 |
| PHQ-9 Q9 | Score = 3 (Nearly every day) |
| BDI-II Item 9 | Score = 3 (Would kill if had chance) |
| Clinical presentation | Intent, plan, or preparatory behaviors |

**Action:**
- [ ] **IMMEDIATE INTERVENTION REQUIRED**
- [ ] Do not leave person alone if possible
- [ ] Contact emergency services (911/local)
- [ ] Initiate involuntary hold if applicable
- [ ] Contact support system/family
- [ ] Document all actions
- [ ] Follow up after crisis resolution

---

### 5.2 Step-by-Step Crisis Protocol

#### STEP 1: Initial Screening

```
FOR ALL NEW USERS:
    1. Administer C-SSRS screener (2-6 questions)
    2. Include PHQ-9 Question 9
    3. Document responses
    4. Calculate risk level
    5. Proceed to appropriate pathway
```

#### STEP 2: Risk Assessment

```
IF Risk Level 0:
    → Continue with standard interaction
    → Include general mental health resources
    
IF Risk Level 1:
    → Provide safety planning resources
    → Offer crisis hotline numbers
    → Schedule follow-up
    → Document assessment
    
IF Risk Level 2:
    → Initiate safety planning conversation
    → Provide immediate crisis resources
    → Recommend professional evaluation
    → Contact within 24-48 hours
    → Document thoroughly
    
IF Risk Level 3:
    → ACTIVATE EMERGENCY PROTOCOL
    → Provide crisis resources immediately
    → Encourage calling emergency services
    → Attempt to identify location
    → Escalate to human crisis counselor
    → Document emergency intervention
```

#### STEP 3: Safety Planning

**Essential Elements of Safety Plan:**

1. **Warning Signs**
   - Personal triggers and early warning signs
   - Situations that increase risk

2. **Internal Coping Strategies**
   - Activities that help when alone
   - Relaxation techniques
   - Distraction methods

3. **Social Support**
   - People who can help
   - Contact information
   - Places for social connection

4. **Professional Resources**
   - Therapist/counselor contact
   - Crisis hotlines
   - Emergency services

5. **Means Restriction**
   - Remove or secure lethal means
   - Involve family/friends in safety

#### STEP 4: Documentation

**Required Documentation Elements:**

| Element | Details to Record |
|---------|-------------------|
| **Date/Time** | When risk was identified |
| **Risk Level** | 0-3 classification |
| **Assessment Tool** | C-SSRS, PHQ-9, etc. |
| **Specific Responses** | Exact responses to screening |
| **Clinical Observations** | Behavior, affect, presentation |
| **Actions Taken** | All interventions |
| **Safety Plan** | Completed and reviewed |
| **Follow-up Plan** | Next contact scheduled |
| **Consultation** | Supervisor/colleague input |

#### STEP 5: Follow-up

| Risk Level | Follow-up Timeline | Method |
|------------|-------------------|--------|
| Level 0 | Next scheduled contact | Standard |
| Level 1 | Within 1 week | Phone/video preferred |
| Level 2 | Within 24-48 hours | Phone/video required |
| Level 3 | Post-crisis within 24 hours | In-person if possible |

---

### 5.3 AI-Specific Crisis Detection Protocol

#### Keyword Detection Triggers

**CRITICAL Keywords (Immediate Escalation):**
- "I'm going to kill myself"
- "I have a plan to die"
- "I'm going to end it all"
- "Goodbye forever"
- "I can't go on"
- "No one will miss me"
- "I want to die"

**HIGH-RISK Keywords (Enhanced Monitoring):**
- "Hopeless"
- "Worthless"
- "Burden"
- "No point"
- "Better off dead"
- "Hurting myself"
- "Ending the pain"

**CONTEXTUAL Risk Indicators:**
- Sudden positive mood after prolonged depression
- Giving away possessions
- Saying goodbye
- Increased substance use mentions
- Social withdrawal descriptions

#### AI Response Protocol

```
WHEN crisis keywords detected:
    1. IMMEDIATELY display crisis resources
    2. Pause normal conversation flow
    3. Express concern and empathy
    4. Ask direct questions about safety
    5. Provide crisis hotline numbers
    6. Offer to connect to human support
    7. Document interaction for review
    8. Flag for clinician follow-up
```

#### Escalation to Human Support

| Trigger | Action |
|---------|--------|
| User expresses imminent intent | Immediate human handoff |
| User refuses safety resources | Human counselor notification |
| Multiple high-risk indicators | Priority escalation |
| User requests human support | Immediate transfer |
| AI uncertainty about risk | Clinician review within 1 hour |

---

## 6. IMPLEMENTATION GUIDELINES FOR AI SYSTEMS

### 6.1 Technical Requirements

#### Crisis Detection System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERACTION                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              REAL-TIME RISK MONITORING                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Keyword    │  │  Sentiment  │  │  Contextual         │  │
│  │  Detection  │  │  Analysis   │  │  Assessment         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                 RISK SCORING ENGINE                          │
│                    (0-3 Classification)                      │
└─────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
      ┌─────────┐     ┌─────────┐     ┌─────────┐
      │ Level 0 │     │ Level 1 │     │ Level 2 │
      │ (Green) │     │ (Yellow)│     │ (Orange)│
      └─────────┘     └─────────┘     └─────────┘
                            │
                            ▼
                     ┌─────────┐
                     │ Level 3 │
                     │  (Red)  │
                     └─────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              ESCALATION & RESPONSE SYSTEM                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Automated  │  │  Human      │  │  Emergency          │  │
│  │  Resources  │  │  Handoff    │  │  Services           │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Safety Requirements

#### Minimum Safety Standards

| Requirement | Implementation |
|-------------|----------------|
| **Crisis resource display** | Automatic on risk detection |
| **Human escalation pathway** | Clear, tested, 24/7 availability |
| **Documentation** | Complete audit trail |
| **Clinician oversight** | Regular review of flagged interactions |
| **Crisis training** | All staff trained in crisis response |
| **Legal compliance** | Adherence to jurisdiction-specific requirements |

#### Prohibited AI Behaviors

**AI MUST NOT:**
- Provide medical diagnoses
- Recommend medication changes
- Dismiss or minimize suicidal ideation
- Provide means or methods for self-harm
- Engage in prolonged crisis conversations without human backup
- Promise confidentiality in crisis situations
- Make guarantees about outcomes

### 6.3 User Communication

#### Required Disclosures

**At First Interaction:**
- AI is not a substitute for professional mental health care
- Crisis resources are available
- Limits of AI capabilities
- When and how human support is available

**During Crisis Detection:**
- Immediate crisis resource display
- Clear statement that AI is not equipped for crisis situations
- Encouragement to contact human support
- Information about emergency services

### 6.4 Quality Assurance

#### Monitoring Metrics

| Metric | Target |
|--------|--------|
| Crisis detection sensitivity | >95% |
| False positive rate | <10% |
| Time to crisis resource display | <5 seconds |
| Human escalation time (Level 3) | <2 minutes |
| Documentation completeness | 100% |

#### Regular Audits

| Audit Type | Frequency |
|------------|-----------|
| Crisis interaction review | Weekly |
| Detection accuracy assessment | Monthly |
| Protocol compliance check | Quarterly |
| Legal compliance review | Annually |

---

## APPENDICES

### Appendix A: Quick Reference Cards

#### Crisis Risk Assessment Quick Guide

| If you hear... | Risk Level | Action |
|----------------|------------|--------|
| "I wish I were dead" | Level 1 | Safety plan, follow-up |
| "I've thought about killing myself" | Level 1 | Safety plan, follow-up |
| "I've thought about how I'd do it" | Level 2 | Immediate safety plan, 24-48hr follow-up |
| "I intend to act on these thoughts" | Level 3 | **EMERGENCY - Immediate intervention** |
| "I have a plan" | Level 3 | **EMERGENCY - Immediate intervention** |
| "I've prepared to end my life" | Level 3 | **EMERGENCY - Immediate intervention** |

#### Emergency Contact Quick Reference

| Country | Crisis Line | Emergency |
|---------|-------------|-----------|
| USA | 988 | 911 |
| UK | 116 123 | 999 |
| Canada | 1-833-456-4566 | 911 |
| Australia | 13 11 14 | 000 |
| India | 1800-599-0019 | 112 |

### Appendix B: Documentation Templates

#### Crisis Risk Assessment Form

```
Date/Time: _______________
Client ID: _______________
Assessor: ________________

SCREENING RESULTS:
□ C-SSRS Score: _____ Risk Level: _____
□ PHQ-9 Q9 Score: _____
□ BDI-II Item 9 Score: _____

OVERALL RISK LEVEL:
□ Level 0 (No Risk)
□ Level 1 (Mild Risk)
□ Level 2 (Moderate Risk)
□ Level 3 (High Risk)

CLINICAL OBSERVATIONS:
_________________________________

ACTIONS TAKEN:
□ Safety plan completed
□ Crisis resources provided
□ Emergency services contacted
□ Family/support notified
□ Referral made

FOLLOW-UP PLAN:
_________________________________

Assessor Signature: _______________
```

### Appendix C: Legal Compliance Checklist

#### By Jurisdiction

| Jurisdiction | Child Abuse | Adult Abuse | Suicide Risk | Harm to Others |
|--------------|-------------|-------------|--------------|----------------|
| USA | Mandatory | Varies | Clinical | Mandatory (Tarasoff) |
| UK | Mandatory | Varies | Clinical | Permissive |
| Canada | Mandatory | Varies | Clinical | Permissive |
| Australia | Mandatory | Varies | Clinical | Permissive |
| India | Mandatory | Varies | Clinical | N/A |

---

## REFERENCES

1. Posner, K., et al. (2011). The Columbia-Suicide Severity Rating Scale. American Journal of Psychiatry.
2. Kroenke, K., et al. (2001). The PHQ-9: Validity of a brief depression severity measure. J Gen Intern Med.
3. Spitzer, R.L., et al. (2006). A brief measure for assessing generalized anxiety disorder. Arch Intern Med.
4. Beck, A.T., et al. (1996). Beck Depression Inventory-II Manual. Psychological Corporation.
5. Columbia Lighthouse Project. (2024). About the C-SSRS. https://cssrs.columbia.edu
6. American Psychological Association. (2025). Health advisory on AI chatbots for mental health.
7. National Institute of Mental Health. (2023). Telehealth Suicide Risk Pathway.
8. Mental Healthcare Act 2017 (India). Section 115.
9. Tarasoff v. Regents of University of California (1976) 17 Cal.3d 425.
10. British Association for Counselling and Psychotherapy. (2019). Managing confidentiality guidelines.

---

**Document Control:**
- Version: 1.0
- Classification: Safety-Critical
- Review Cycle: Quarterly
- Next Review Date: [3 months from publication]
- Owner: MindMate AI Safety Team

**DISCLAIMER:** This document provides general guidance only. Always consult with legal counsel and licensed mental health professionals for jurisdiction-specific requirements and clinical decisions.

---

*This playbook is a living document and should be updated regularly to reflect changes in laws, best practices, and platform capabilities.*
