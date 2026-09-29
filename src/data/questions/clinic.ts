import { q } from "../types";

export const clinicQuestions = [
  q({
    id: "clinic-01",
    topicId: "clinic",
    difficulty: "easy",
    title: "Clinic roster",
    summary: "Return every clinician column.",
    role: "Clinic coordinator",
    context: "The front desk wants the full clinician roster, including a missing room.",
    task: "Return every column from clinicians, in table order.",
    requiredOutput: ["All clinician columns", "All 5 clinicians", "A null room stays null"],
    rules: ["Use only clinicians", "Do not filter or sort"],
    success: "The grid matches the clinicians table.",
    hints: ["Read every column with an asterisk.", "SELECT * FROM clinicians;"],
    solutionSql: "SELECT * FROM clinicians;",
    tablesUsed: ["clinicians"],
    concept: "select all columns",
  }),
  q({
    id: "clinic-02",
    topicId: "clinic",
    difficulty: "easy",
    title: "Patient names",
    summary: "Project the two name columns.",
    role: "Clinic coordinator",
    context: "Reception wants a name list, not birth dates or assigned clinicians.",
    task: "Return first_name and last_name from patients.",
    requiredOutput: ["Columns in this order: first_name, last_name", "Every patient"],
    rules: ["Do not rename the columns", "Do not filter"],
    success: "Each patient appears once with those two fields.",
    hints: ["List the columns in the order the grid should use.", "SELECT first_name, last_name FROM patients;"],
    solutionSql: "SELECT first_name, last_name FROM patients;",
    tablesUsed: ["patients"],
    concept: "project columns",
  }),
  q({
    id: "clinic-03",
    topicId: "clinic",
    difficulty: "easy",
    title: "Higher fees",
    summary: "Keep visits billed over 100.",
    role: "Billing clerk",
    context: "Billing is checking the larger visit fees. A missing fee is not over 100.",
    task: "Return id, reason, and fee for visits whose fee is greater than 100.",
    requiredOutput: ["Columns: id, reason, fee", "Fees of 100 or less, and null fees, stay out"],
    rules: ["Compare fee with > 100"],
    success: "Only the two higher fees remain.",
    hints: ["A null fee fails a greater-than test.", "SELECT id, reason, fee FROM visits WHERE fee > 100;"],
    solutionSql: "SELECT id, reason, fee FROM visits WHERE fee > 100;",
    tablesUsed: ["visits"],
    concept: "filter numbers",
  }),
  q({
    id: "clinic-04",
    topicId: "clinic",
    difficulty: "easy",
    title: "Unassigned patients",
    summary: "Find patients with no clinician.",
    role: "Clinic coordinator",
    context: "One patient walked in without an assigned clinician.",
    task: "Return first_name and last_name where clinician_id is null.",
    requiredOutput: ["Columns: first_name, last_name", "Only the unassigned patient"],
    rules: ["Test the null with IS NULL"],
    success: "Jonah Adeyemi is the only row.",
    hints: ["A missing id is not equal to a number.", "SELECT first_name, last_name FROM patients WHERE clinician_id IS NULL;"],
    solutionSql: "SELECT first_name, last_name FROM patients WHERE clinician_id IS NULL;",
    tablesUsed: ["patients"],
    concept: "filter nulls",
  }),
  q({
    id: "clinic-05",
    topicId: "clinic",
    difficulty: "medium",
    title: "Who is assigned",
    summary: "Keep patients who have no clinician.",
    role: "Clinic coordinator",
    context: "The assignment list should still show a patient when no clinician is on the record.",
    task: "Return patient as first and last name separated by a space, and assigned as the clinician name. Sort by last name, then first name.",
    requiredOutput: ["Columns: patient, assigned", "Unassigned patients stay, with a null assigned name", "That sort"],
    rules: ["Left join patients to clinicians"],
    success: "Every patient appears once, including Jonah.",
    orderMatters: true,
    hints: [
      "A left join keeps the patient when the clinician id is null.",
      "SELECT p.first_name || ' ' || p.last_name AS patient, c.name AS assigned FROM patients p LEFT JOIN clinicians c ON c.id = p.clinician_id ORDER BY p.last_name, p.first_name;",
    ],
    solutionSql: `SELECT p.first_name || ' ' || p.last_name AS patient, c.name AS assigned
FROM patients p
LEFT JOIN clinicians c ON c.id = p.clinician_id
ORDER BY p.last_name, p.first_name;`,
    tablesUsed: ["patients", "clinicians"],
    concept: "left join",
  }),
  q({
    id: "clinic-06",
    topicId: "clinic",
    difficulty: "medium",
    title: "Cardiology visits",
    summary: "Join visits to one specialty.",
    role: "Cardiology lead",
    context: "Cardiology wants its own visit list, with the patient name on each row.",
    task: "Return visited_on, patient, reason, and fee for visits whose clinician specialty is Cardiology. patient is first and last name separated by a space. Sort by visited_on, then visit id.",
    requiredOutput: ["Columns: visited_on, patient, reason, fee", "That sort"],
    rules: ["Join visits to patients and clinicians", "specialty = 'Cardiology'"],
    success: "Three cardiology visits, oldest first.",
    orderMatters: true,
    hints: [
      "Filter the specialty after joining the clinician.",
      "SELECT v.visited_on, p.first_name || ' ' || p.last_name AS patient, v.reason, v.fee FROM visits v JOIN patients p ON p.id = v.patient_id JOIN clinicians c ON c.id = v.clinician_id WHERE c.specialty = 'Cardiology' ORDER BY v.visited_on, v.id;",
    ],
    solutionSql: `SELECT v.visited_on, p.first_name || ' ' || p.last_name AS patient, v.reason, v.fee
FROM visits v
JOIN patients p ON p.id = v.patient_id
JOIN clinicians c ON c.id = v.clinician_id
WHERE c.specialty = 'Cardiology'
ORDER BY v.visited_on, v.id;`,
    tablesUsed: ["visits", "patients", "clinicians"],
    concept: "filter a join",
  }),
  q({
    id: "clinic-07",
    topicId: "clinic",
    difficulty: "medium",
    title: "Visits by specialty",
    summary: "Count visits, including a specialty with none.",
    role: "Clinic coordinator",
    context: "Neurology is on the roster and has not seen anyone yet. That zero still belongs on the report.",
    task: "Return specialty and visits. visits is the number of visits for that specialty. Sort by specialty.",
    requiredOutput: ["Columns: specialty, visits", "Neurology is 0", "Sorted by specialty"],
    rules: ["Start from clinicians so an empty specialty remains", "COUNT the visit id, not the clinician row"],
    success: "Five specialties, one of them zero.",
    orderMatters: true,
    hints: [
      "Left join visits onto clinicians, then group by specialty.",
      "SELECT c.specialty, COUNT(v.id) AS visits FROM clinicians c LEFT JOIN visits v ON v.clinician_id = c.id GROUP BY c.specialty ORDER BY c.specialty;",
    ],
    solutionSql: `SELECT c.specialty, COUNT(v.id) AS visits
FROM clinicians c
LEFT JOIN visits v ON v.clinician_id = c.id
GROUP BY c.specialty
ORDER BY c.specialty;`,
    tablesUsed: ["clinicians", "visits"],
    concept: "count with zeros",
  }),
  q({
    id: "clinic-08",
    topicId: "clinic",
    difficulty: "medium",
    title: "Patients never seen",
    summary: "Anti-join the visit table.",
    role: "Clinic coordinator",
    context: "Two patients are on the books and have never had a visit.",
    task: "Return patient as first and last name separated by a space. Sort by last name, then first name.",
    requiredOutput: ["Column: patient", "That sort"],
    rules: ["Keep patients whose visit id is null"],
    success: "Priya Nair and Tess Quinn remain.",
    orderMatters: true,
    hints: [
      "Left join visits and discard rows that found a visit.",
      "SELECT p.first_name || ' ' || p.last_name AS patient FROM patients p LEFT JOIN visits v ON v.patient_id = p.id WHERE v.id IS NULL ORDER BY p.last_name, p.first_name;",
    ],
    solutionSql: `SELECT p.first_name || ' ' || p.last_name AS patient
FROM patients p
LEFT JOIN visits v ON v.patient_id = p.id
WHERE v.id IS NULL
ORDER BY p.last_name, p.first_name;`,
    tablesUsed: ["patients", "visits"],
    concept: "anti-join",
  }),
  q({
    id: "clinic-09",
    topicId: "clinic",
    difficulty: "medium",
    title: "Fees collected",
    summary: "Sum fees, treating a missing fee as absent.",
    role: "Billing clerk",
    context: "A follow-up has no fee yet. It must not become zero, and a clinician with no visits still shows 0.",
    task: "Return clinician and fees. fees is the sum of recorded visit fees, or 0 when that clinician has no fee rows. Sort by fees descending, then clinician.",
    requiredOutput: ["Columns: clinician, fees", "That sort", "Noor El-Sayed is 0"],
    rules: ["SUM skips null fees", "Left join so a clinician with no visits remains"],
    success: "Ben Cho leads, and Neurology is present at 0.",
    orderMatters: true,
    hints: [
      "COALESCE the sum so an empty group is 0.",
      "SELECT c.name AS clinician, COALESCE(SUM(v.fee), 0) AS fees FROM clinicians c LEFT JOIN visits v ON v.clinician_id = c.id GROUP BY c.id, c.name ORDER BY fees DESC, clinician;",
    ],
    solutionSql: `SELECT c.name AS clinician, COALESCE(SUM(v.fee), 0) AS fees
FROM clinicians c
LEFT JOIN visits v ON v.clinician_id = c.id
GROUP BY c.id, c.name
ORDER BY fees DESC, clinician;`,
    tablesUsed: ["clinicians", "visits"],
    concept: "sum with nulls",
  }),
  q({
    id: "clinic-10",
    topicId: "clinic",
    difficulty: "medium",
    title: "Minutes by reason",
    summary: "Average recorded minutes.",
    role: "Operations lead",
    context: "One labs visit never recorded minutes. Leave that reason off the average.",
    task: "Return reason and avg_minutes, rounded to 1 decimal. Ignore visits whose minutes are null. Sort by reason.",
    requiredOutput: ["Columns: reason, avg_minutes", "Labs is absent", "Sorted by reason"],
    rules: ["Filter minutes IS NOT NULL before the average"],
    success: "Six reasons, with checkup at 22.5.",
    orderMatters: true,
    hints: [
      "Drop the null minutes before you group.",
      "SELECT reason, ROUND(AVG(minutes), 1) AS avg_minutes FROM visits WHERE minutes IS NOT NULL GROUP BY reason ORDER BY reason;",
    ],
    solutionSql: `SELECT reason, ROUND(AVG(minutes), 1) AS avg_minutes
FROM visits
WHERE minutes IS NOT NULL
GROUP BY reason
ORDER BY reason;`,
    tablesUsed: ["visits"],
    concept: "average",
  }),
  q({
    id: "clinic-11",
    topicId: "clinic",
    difficulty: "medium",
    title: "Seen by someone else",
    summary: "Compare the visit clinician with the assigned one.",
    role: "Clinic coordinator",
    context: "A patient can be seen by a clinician who is not the one on their record.",
    task: "Return patient, assigned, seen_by, visited_on, and reason for visits where the visit clinician is different from the patient's assigned clinician. Names are the clinician name, and patient is first and last name separated by a space.",
    requiredOutput: ["Columns: patient, assigned, seen_by, visited_on, reason"],
    rules: ["Join the clinician table twice", "A null assignment does not count as a mismatch"],
    success: "Noah Patel's chest-pain visit is the only row.",
    hints: [
      "Inequality on two clinician ids drops the null assignment.",
      "SELECT p.first_name || ' ' || p.last_name AS patient, assigned.name AS assigned, seen.name AS seen_by, v.visited_on, v.reason FROM visits v JOIN patients p ON p.id = v.patient_id JOIN clinicians assigned ON assigned.id = p.clinician_id JOIN clinicians seen ON seen.id = v.clinician_id WHERE v.clinician_id <> p.clinician_id;",
    ],
    solutionSql: `SELECT p.first_name || ' ' || p.last_name AS patient,
  assigned.name AS assigned,
  seen.name AS seen_by,
  v.visited_on,
  v.reason
FROM visits v
JOIN patients p ON p.id = v.patient_id
JOIN clinicians assigned ON assigned.id = p.clinician_id
JOIN clinicians seen ON seen.id = v.clinician_id
WHERE v.clinician_id <> p.clinician_id;`,
    tablesUsed: ["visits", "patients", "clinicians"],
    concept: "self comparison across roles",
  }),
  q({
    id: "clinic-12",
    topicId: "clinic",
    difficulty: "hard",
    title: "Capstone patient card",
    summary: "Assignment, visit count, fees, and last visit for every patient.",
    role: "Clinic director",
    context: "The card keeps every patient. Fees add recorded amounts only. A missing fee is skipped, and a patient with no visits shows 0 and a null last visit.",
    task: "Return patient, assigned, visit_count, fees_paid, and last_visit. patient is first and last name separated by a space. assigned is the assigned clinician name, or null. visit_count counts visits. fees_paid sums recorded fees, or 0. last_visit is the latest visited_on, or null. Sort by fees_paid descending, then patient.",
    requiredOutput: ["Columns in that order", "Patients with no visits show 0 and null", "That sort"],
    rules: ["Do not drop unassigned patients", "COUNT the visit id"],
    success: "The patient card matches the contract.",
    orderMatters: true,
    hints: [
      "Left join both the assigned clinician and the visits, then group by patient.",
      "SELECT p.first_name || ' ' || p.last_name AS patient, c.name AS assigned, COUNT(v.id) AS visit_count, COALESCE(SUM(v.fee), 0) AS fees_paid, MAX(v.visited_on) AS last_visit FROM patients p LEFT JOIN clinicians c ON c.id = p.clinician_id LEFT JOIN visits v ON v.patient_id = p.id GROUP BY p.id, p.first_name, p.last_name, c.name ORDER BY fees_paid DESC, patient;",
    ],
    solutionSql: `SELECT p.first_name || ' ' || p.last_name AS patient,
  c.name AS assigned,
  COUNT(v.id) AS visit_count,
  COALESCE(SUM(v.fee), 0) AS fees_paid,
  MAX(v.visited_on) AS last_visit
FROM patients p
LEFT JOIN clinicians c ON c.id = p.clinician_id
LEFT JOIN visits v ON v.patient_id = p.id
GROUP BY p.id, p.first_name, p.last_name, c.name
ORDER BY fees_paid DESC, patient;`,
    tablesUsed: ["patients", "clinicians", "visits"],
    concept: "patient card",
  }),
];
