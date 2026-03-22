import React, { useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
  Spinner,
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { createCandidate } from '../services/candidateService';
import { isNormalizedApiError } from '../services/apiError';
import { uploadFile } from '../services/uploadService';
import {
  buildCreateCandidatePayload,
  MAX_EDUCATION_ROWS,
  validateCandidateForm,
  type AddCandidateFormState,
  type EducationFormRow,
  type FieldErrors,
  type WorkFormRow,
} from '../validation/candidateFormValidation';

const emptyEducation = (): EducationFormRow => ({
  institution: '',
  title: '',
  startDate: '',
  endDate: '',
});

const emptyWork = (): WorkFormRow => ({
  company: '',
  position: '',
  description: '',
  startDate: '',
  endDate: '',
});

const initialState = (): AddCandidateFormState => ({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  educations: [],
  workExperiences: [],
});

export function AddCandidatePage(): JSX.Element {
  const [form, setForm] = useState<AddCandidateFormState>(initialState);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);

  const setField = <K extends keyof AddCandidateFormState>(
    key: K,
    value: AddCandidateFormState[K],
  ): void => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    setCvFile(file ?? null);
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.cvFile;
      return next;
    });
  };

  const clearFile = (): void => {
    setCvFile(null);
    setFileInputKey((k) => k + 1);
  };

  const addEducation = (): void => {
    if (form.educations.length >= MAX_EDUCATION_ROWS) {
      return;
    }
    setForm((prev) => ({
      ...prev,
      educations: [...prev.educations, emptyEducation()],
    }));
  };

  const removeEducation = (index: number): void => {
    setForm((prev) => ({
      ...prev,
      educations: prev.educations.filter((_, i) => i !== index),
    }));
  };

  const updateEducation = (
    index: number,
    field: keyof EducationFormRow,
    value: string,
  ): void => {
    setForm((prev) => {
      const next = [...prev.educations];
      const row = { ...next[index], [field]: value };
      next[index] = row;
      return { ...prev, educations: next };
    });
  };

  const addWork = (): void => {
    setForm((prev) => ({
      ...prev,
      workExperiences: [...prev.workExperiences, emptyWork()],
    }));
  };

  const removeWork = (index: number): void => {
    setForm((prev) => ({
      ...prev,
      workExperiences: prev.workExperiences.filter((_, i) => i !== index),
    }));
  };

  const updateWork = (
    index: number,
    field: keyof WorkFormRow,
    value: string,
  ): void => {
    setForm((prev) => {
      const next = [...prev.workExperiences];
      const row = { ...next[index], [field]: value };
      next[index] = row;
      return { ...prev, workExperiences: next };
    });
  };

  const onSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setSubmitError(null);
    setSuccessId(null);

    const validation = validateCandidateForm(form, cvFile);
    setFieldErrors(validation.errors);
    if (!validation.valid) {
      return;
    }

    setLoading(true);
    try {
      let cvPayload:
        | { filePath: string; fileType: string }
        | undefined;

      if (cvFile) {
        const uploaded = await uploadFile(cvFile);
        cvPayload = {
          filePath: uploaded.filePath,
          fileType: uploaded.fileType,
        };
      }

      const body = buildCreateCandidatePayload(form, cvPayload);
      const created = await createCandidate(body);
      setSuccessId(created.id);
      setForm(initialState());
      setCvFile(null);
      setFileInputKey((k) => k + 1);
      setFieldErrors({});
    } catch (err) {
      if (isNormalizedApiError(err)) {
        const normalized = err;
        if (normalized.kind === 'duplicate_email') {
          const emailMessage = normalized.message;
          setFieldErrors((prev) => ({
            ...prev,
            email: emailMessage,
          }));
          setSubmitError(null);
        } else {
          setSubmitError(normalized.message);
        }
      } else {
        setSubmitError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fe = (key: string): string | undefined => fieldErrors[key];

  return (
    <Container className="py-4">
      <p className="mb-3">
        <Link to="/">Back to dashboard</Link>
      </p>
      <h1 className="h3 mb-4">Add candidate</h1>

      {successId !== null && (
        <Alert
          variant="success"
          className="mb-4"
          role="status"
          dismissible
          onClose={() => setSuccessId(null)}
        >
          Candidate added successfully. Reference id: <strong>{successId}</strong>
          .
        </Alert>
      )}

      {submitError && (
        <Alert variant="danger" className="mb-4" role="alert">
          {submitError}
        </Alert>
      )}

      <Form noValidate onSubmit={onSubmit}>
        <Card className="mb-4">
          <Card.Header>Identity and contact</Card.Header>
          <Card.Body>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group controlId="firstName">
                  <Form.Label>First name</Form.Label>
                  <Form.Control
                    data-testid="field-firstName"
                    value={form.firstName}
                    onChange={(e) => setField('firstName', e.target.value)}
                    isInvalid={!!fe('firstName')}
                    aria-describedby="firstName-feedback"
                  />
                  <Form.Control.Feedback id="firstName-feedback" type="invalid">
                    {fe('firstName')}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="lastName">
                  <Form.Label>Last name</Form.Label>
                  <Form.Control
                    data-testid="field-lastName"
                    value={form.lastName}
                    onChange={(e) => setField('lastName', e.target.value)}
                    isInvalid={!!fe('lastName')}
                  />
                  <Form.Control.Feedback type="invalid">
                    {fe('lastName')}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="email">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    data-testid="field-email"
                    value={form.email}
                    onChange={(e) => setField('email', e.target.value)}
                    isInvalid={!!fe('email')}
                    autoComplete="email"
                  />
                  <Form.Control.Feedback type="invalid">
                    {fe('email')}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="phone">
                  <Form.Label>Phone (optional)</Form.Label>
                  <Form.Control
                    value={form.phone}
                    onChange={(e) => setField('phone', e.target.value)}
                    isInvalid={!!fe('phone')}
                    inputMode="numeric"
                  />
                  <Form.Control.Feedback type="invalid">
                    {fe('phone')}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Form.Group controlId="address">
                  <Form.Label>Address (optional)</Form.Label>
                  <Form.Control
                    value={form.address}
                    onChange={(e) => setField('address', e.target.value)}
                    isInvalid={!!fe('address')}
                  />
                  <Form.Control.Feedback type="invalid">
                    {fe('address')}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Card className="mb-4">
          <Card.Header>Education</Card.Header>
          <Card.Body>
            {fe('educations') && (
              <Alert variant="warning">{fe('educations')}</Alert>
            )}
            {form.educations.map((row, i) => (
              <div key={i} className="border rounded p-3 mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <strong>Education {i + 1}</strong>
                  <Button
                    type="button"
                    variant="outline-danger"
                    size="sm"
                    onClick={() => removeEducation(i)}
                  >
                    Remove
                  </Button>
                </div>
                <Row className="g-2">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Institution</Form.Label>
                      <Form.Control
                        value={row.institution}
                        onChange={(e) =>
                          updateEducation(i, 'institution', e.target.value)
                        }
                        isInvalid={!!fe(`educations.${i}.institution`)}
                      />
                      <Form.Control.Feedback type="invalid">
                        {fe(`educations.${i}.institution`)}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Title</Form.Label>
                      <Form.Control
                        value={row.title}
                        onChange={(e) =>
                          updateEducation(i, 'title', e.target.value)
                        }
                        isInvalid={!!fe(`educations.${i}.title`)}
                      />
                      <Form.Control.Feedback type="invalid">
                        {fe(`educations.${i}.title`)}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Start date</Form.Label>
                      <Form.Control
                        type="date"
                        value={row.startDate}
                        onChange={(e) =>
                          updateEducation(i, 'startDate', e.target.value)
                        }
                        isInvalid={!!fe(`educations.${i}.startDate`)}
                      />
                      <Form.Control.Feedback type="invalid">
                        {fe(`educations.${i}.startDate`)}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>End date (optional)</Form.Label>
                      <Form.Control
                        type="date"
                        value={row.endDate}
                        onChange={(e) =>
                          updateEducation(i, 'endDate', e.target.value)
                        }
                        isInvalid={!!fe(`educations.${i}.endDate`)}
                      />
                      <Form.Control.Feedback type="invalid">
                        {fe(`educations.${i}.endDate`)}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>
              </div>
            ))}
            <Button
              type="button"
              variant="outline-primary"
              onClick={addEducation}
              disabled={form.educations.length >= MAX_EDUCATION_ROWS}
            >
              Add education
            </Button>
          </Card.Body>
        </Card>

        <Card className="mb-4">
          <Card.Header>Work experience</Card.Header>
          <Card.Body>
            {form.workExperiences.map((row, i) => (
              <div key={i} className="border rounded p-3 mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <strong>Role {i + 1}</strong>
                  <Button
                    type="button"
                    variant="outline-danger"
                    size="sm"
                    onClick={() => removeWork(i)}
                  >
                    Remove
                  </Button>
                </div>
                <Row className="g-2">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Company</Form.Label>
                      <Form.Control
                        value={row.company}
                        onChange={(e) =>
                          updateWork(i, 'company', e.target.value)
                        }
                        isInvalid={!!fe(`workExperiences.${i}.company`)}
                      />
                      <Form.Control.Feedback type="invalid">
                        {fe(`workExperiences.${i}.company`)}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Position</Form.Label>
                      <Form.Control
                        value={row.position}
                        onChange={(e) =>
                          updateWork(i, 'position', e.target.value)
                        }
                        isInvalid={!!fe(`workExperiences.${i}.position`)}
                      />
                      <Form.Control.Feedback type="invalid">
                        {fe(`workExperiences.${i}.position`)}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col xs={12}>
                    <Form.Group>
                      <Form.Label>Description (optional)</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        value={row.description}
                        onChange={(e) =>
                          updateWork(i, 'description', e.target.value)
                        }
                        isInvalid={!!fe(`workExperiences.${i}.description`)}
                      />
                      <Form.Control.Feedback type="invalid">
                        {fe(`workExperiences.${i}.description`)}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Start date</Form.Label>
                      <Form.Control
                        type="date"
                        value={row.startDate}
                        onChange={(e) =>
                          updateWork(i, 'startDate', e.target.value)
                        }
                        isInvalid={!!fe(`workExperiences.${i}.startDate`)}
                      />
                      <Form.Control.Feedback type="invalid">
                        {fe(`workExperiences.${i}.startDate`)}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>End date (optional)</Form.Label>
                      <Form.Control
                        type="date"
                        value={row.endDate}
                        onChange={(e) =>
                          updateWork(i, 'endDate', e.target.value)
                        }
                        isInvalid={!!fe(`workExperiences.${i}.endDate`)}
                      />
                      <Form.Control.Feedback type="invalid">
                        {fe(`workExperiences.${i}.endDate`)}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>
              </div>
            ))}
            <Button type="button" variant="outline-primary" onClick={addWork}>
              Add work experience
            </Button>
          </Card.Body>
        </Card>

        <Card className="mb-4">
          <Card.Header>CV (optional)</Card.Header>
          <Card.Body>
            <Form.Group controlId="cv">
              <Form.Label>Resume file</Form.Label>
              <Form.Control
                key={fileInputKey}
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={onFileChange}
                isInvalid={!!fe('cvFile')}
                data-testid="field-cv"
              />
              <Form.Control.Feedback type="invalid">
                {fe('cvFile')}
              </Form.Control.Feedback>
              {cvFile && (
                <div className="mt-2">
                  <span className="me-2 text-muted">{cvFile.name}</span>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={clearFile}
                  >
                    Remove file
                  </Button>
                </div>
              )}
            </Form.Group>
          </Card.Body>
        </Card>

        <div className="d-flex align-items-center gap-3">
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            data-testid="add-candidate-submit"
          >
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Saving…
              </>
            ) : (
              'Save candidate'
            )}
          </Button>
          <Link to="/" className="btn btn-link">
            Cancel
          </Link>
        </div>
      </Form>
    </Container>
  );
}
