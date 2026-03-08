/**
 * Crisis Routes
 * Crisis support and emergency resources endpoints
 */

import { Router } from 'express';
import { validate } from '../../middleware/requestValidator';
import { authMiddleware } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/errorHandler';
import {
  crisisResourcesQuerySchema,
  crisisAlertSchema,
  emergencyContactSchema,
  emergencyContactIdParamSchema,
  crisisCheckInSchema,
} from '../../validations';

const router = Router();

// ==================== PUBLIC ROUTES ====================

/**
 * @route   GET /crisis/resources
 * @desc    Get crisis resources
 * @access  Public
 */
router.get(
  '/resources',
  validate(crisisResourcesQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    // TODO: Implement get crisis resources
    res.json({
      emergency_number: '911',
      resources: [
        {
          id: '988',
          name: '988 Suicide & Crisis Lifeline',
          type: 'hotline',
          phone: '988',
          text_number: '988',
          website: 'https://988lifeline.org',
          description: '24/7, free and confidential support for people in distress',
          available_24_7: true,
          languages: ['en', 'es'],
          specialties: ['suicide', 'general'],
        },
      ],
      disclaimer: 'If you are in immediate danger, please call 911 or your local emergency number.',
    });
  })
);

// ==================== PROTECTED ROUTES ====================

// Apply authentication middleware to remaining routes
router.use(authMiddleware);

/**
 * @route   POST /crisis/alert
 * @desc    Send crisis alert
 * @access  Private
 */
router.post(
  '/alert',
  validate(crisisAlertSchema),
  asyncHandler(async (req, res) => {
    // TODO: Implement crisis alert
    res.json({
      alert_id: null,
      status: 'sent',
      recipients: [],
    });
  })
);

// ==================== EMERGENCY CONTACTS ====================

/**
 * @route   GET /crisis/emergency-contacts
 * @desc    Get emergency contacts
 * @access  Private
 */
router.get(
  '/emergency-contacts',
  asyncHandler(async (req, res) => {
    // TODO: Implement get emergency contacts
    res.json({
      contacts: [],
    });
  })
);

/**
 * @route   POST /crisis/emergency-contacts
 * @desc    Add emergency contact
 * @access  Private
 */
router.post(
  '/emergency-contacts',
  validate(emergencyContactSchema),
  asyncHandler(async (req, res) => {
    // TODO: Implement add emergency contact
    res.status(201).json({
      id: null,
      name: req.body.name,
      relationship: req.body.relationship,
      phone: req.body.phone || null,
      email: req.body.email || null,
      is_primary: req.body.is_primary || false,
      notify_on_crisis: req.body.notify_on_crisis ?? true,
      notify_on_check_in: req.body.notify_on_check_in ?? false,
      created_at: new Date().toISOString(),
    });
  })
);

/**
 * @route   GET /crisis/emergency-contacts/:contact_id
 * @desc    Get emergency contact
 * @access  Private
 */
router.get(
  '/emergency-contacts/:contact_id',
  validate(emergencyContactIdParamSchema, 'params'),
  asyncHandler(async (req, res) => {
    // TODO: Implement get emergency contact
    res.json({
      id: null,
      name: null,
      relationship: null,
      phone: null,
      email: null,
      is_primary: false,
      notify_on_crisis: true,
      notify_on_check_in: false,
      created_at: null,
    });
  })
);

/**
 * @route   PATCH /crisis/emergency-contacts/:contact_id
 * @desc    Update emergency contact
 * @access  Private
 */
router.patch(
  '/emergency-contacts/:contact_id',
  validate(emergencyContactIdParamSchema, 'params'),
  validate(emergencyContactSchema),
  asyncHandler(async (req, res) => {
    // TODO: Implement update emergency contact
    res.json({
      id: null,
      name: req.body.name,
      relationship: req.body.relationship,
      phone: req.body.phone || null,
      email: req.body.email || null,
      is_primary: req.body.is_primary || false,
      notify_on_crisis: req.body.notify_on_crisis ?? true,
      notify_on_check_in: req.body.notify_on_check_in ?? false,
      created_at: null,
    });
  })
);

/**
 * @route   DELETE /crisis/emergency-contacts/:contact_id
 * @desc    Delete emergency contact
 * @access  Private
 */
router.delete(
  '/emergency-contacts/:contact_id',
  validate(emergencyContactIdParamSchema, 'params'),
  asyncHandler(async (req, res) => {
    // TODO: Implement delete emergency contact
    res.status(204).send();
  })
);

// ==================== CRISIS CHECK-IN ====================

/**
 * @route   POST /crisis/check-in
 * @desc    Crisis check-in
 * @access  Private
 */
router.post(
  '/check-in',
  validate(crisisCheckInSchema),
  asyncHandler(async (req, res) => {
    // TODO: Implement crisis check-in
    res.json({
      risk_level: 'none',
      recommendations: [],
      resources: [],
    });
  })
);

export default router;
