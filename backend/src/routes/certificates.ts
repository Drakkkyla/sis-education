import express, { Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import Certificate from '../models/Certificate';
import { checkAndIssueCertificate, generateCertificatePDF } from '../services/certificateService';

const router = express.Router();

// @route   GET /api/certificates
// @desc    Get all certificates for user
// @access  Private
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = String(req.user!._id);
    const certificates = await Certificate.find({ user: userId })
      .populate('course', 'title description thumbnail category level')
      .sort({ issuedAt: -1 });

    res.json(certificates);
  } catch (error: any) {
    console.error('Get certificates error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// @route   GET /api/certificates/:id
// @desc    Get single certificate
// @access  Private
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = String(req.user!._id);
    const certificate = await Certificate.findOne({
      _id: req.params.id,
      user: userId,
    })
      .populate('course', 'title description thumbnail category level')
      .populate('user', 'firstName lastName username');

    if (!certificate) {
      return res.status(404).json({ message: 'Сертификат не найден' });
    }

    res.json(certificate);
  } catch (error: any) {
    console.error('Get certificate error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// @route   GET /api/certificates/:id/pdf
// @desc    Download certificate as PDF
// @access  Private
router.get('/:id/pdf', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = String(req.user!._id);
    const certificate = await Certificate.findOne({
      _id: req.params.id,
      user: userId,
    });

    if (!certificate) {
      return res.status(404).json({ message: 'Сертификат не найден' });
    }

    const pdfBuffer = await generateCertificatePDF(String(certificate._id));

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="certificate-${certificate.certificateNumber}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('Generate PDF error:', error);
    res.status(500).json({ message: 'Ошибка при генерации PDF' });
  }
});

// @route   POST /api/certificates/check/:courseId
// @desc    Check and issue certificate for course
// @access  Private
router.post('/check/:courseId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = String(req.user!._id);
    const courseId = req.params.courseId;

    const certificate = await checkAndIssueCertificate(userId, courseId);

    if (!certificate) {
      return res.status(400).json({
        message: 'Курс еще не завершен. Завершите все уроки для получения сертификата.',
      });
    }

    await certificate.populate('course', 'title description thumbnail category level');

    res.json({
      message: 'Сертификат успешно выдан',
      certificate,
    });
  } catch (error: any) {
    console.error('Check certificate error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

export default router;

