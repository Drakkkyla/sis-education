import PDFDocument from 'pdfkit';
import Certificate, { ICertificate } from '../models/Certificate';
import Course from '../models/Course';
import User from '../models/User';
import Progress from '../models/Progress';
import QuizResult from '../models/QuizResult';
import Notification from '../models/Notification';

/**
 * Проверяет, завершен ли курс пользователем и выдает сертификат
 */
export async function checkAndIssueCertificate(userId: string, courseId: string): Promise<ICertificate | null> {
  try {
    // Проверяем, не выдан ли уже сертификат
    const existing = await Certificate.findOne({ user: userId, course: courseId });
    if (existing) {
      return existing.toObject() as ICertificate;
    }

    // Получаем курс
    const course = await Course.findById(courseId);
    if (!course || !course.isPublished) {
      return null;
    }

    // Проверяем, завершены ли все уроки курса
    const courseLessons = course.lessons || [];
    if (courseLessons.length === 0) {
      return null;
    }

    const completedLessons = await Progress.countDocuments({
      user: userId,
      course: courseId,
      completed: true,
    });

    // Если не все уроки завершены, сертификат не выдается
    if (completedLessons < courseLessons.length) {
      return null;
    }

    // Вычисляем среднюю оценку (если есть тесты)
    const quizResults = await QuizResult.find({
      user: userId,
      course: courseId,
      passed: true,
    });

    let averageGrade: number | undefined;
    if (quizResults.length > 0) {
      const totalPercentage = quizResults.reduce((sum, result) => sum + result.percentage, 0);
      averageGrade = Math.round(totalPercentage / quizResults.length);
    }

    // Создаем сертификат
    const certificate = await Certificate.create({
      user: userId,
      course: courseId,
      completedAt: new Date(),
      grade: averageGrade,
    });

    // Создаем уведомление
    await Notification.create({
      user: userId,
      type: 'system',
      title: 'Поздравляем! 🎓',
      message: `Вы завершили курс "${course.title}" и получили сертификат!`,
      link: `/certificates`,
    });

    return certificate.toObject() as ICertificate;
  } catch (error) {
    console.error('Error checking and issuing certificate:', error);
    return null;
  }
}

/**
 * Генерирует PDF сертификата
 */
export async function generateCertificatePDF(certificateId: string): Promise<Buffer> {
  const certificate = await Certificate.findById(certificateId)
    .populate('user', 'firstName lastName username')
    .populate('course', 'title description category');

  if (!certificate) {
    throw new Error('Certificate not found');
  }

  const user = certificate.user as any;
  const course = certificate.course as any;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
    });

    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers);
      resolve(pdfBuffer);
    });
    doc.on('error', reject);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const centerX = pageWidth / 2;

    // Градиентный фон (имитация через несколько прямоугольников)
    for (let i = 0; i < 50; i++) {
      const alpha = 0.02;
      const y = (pageHeight / 50) * i;
      doc.rect(0, y, pageWidth, pageHeight / 50)
        .fillColor(`rgba(99, 102, 241, ${alpha})`)
        .fill();
    }

    // Внешняя декоративная рамка (золотая)
    doc.rect(0, 0, pageWidth, pageHeight)
      .lineWidth(25)
      .strokeColor('#d4af37')
      .stroke();

    // Вторая рамка
    doc.rect(25, 25, pageWidth - 50, pageHeight - 50)
      .lineWidth(2)
      .strokeColor('#fbbf24')
      .stroke();

    // Внутренняя декоративная рамка с орнаментом
    const innerMargin = 50;
    const innerWidth = pageWidth - innerMargin * 2;
    const innerHeight = pageHeight - innerMargin * 2;

    // Угловые декоративные элементы (орнамент)
    const cornerSize = 80;
    
    // Левый верхний угол
    doc.moveTo(innerMargin, innerMargin + cornerSize)
      .lineTo(innerMargin, innerMargin)
      .lineTo(innerMargin + cornerSize, innerMargin)
      .lineWidth(3)
      .strokeColor('#d4af37')
      .stroke();

    // Правый верхний угол
    doc.moveTo(pageWidth - innerMargin - cornerSize, innerMargin)
      .lineTo(pageWidth - innerMargin, innerMargin)
      .lineTo(pageWidth - innerMargin, innerMargin + cornerSize)
      .lineWidth(3)
      .strokeColor('#d4af37')
      .stroke();

    // Левый нижний угол
    doc.moveTo(innerMargin, pageHeight - innerMargin - cornerSize)
      .lineTo(innerMargin, pageHeight - innerMargin)
      .lineTo(innerMargin + cornerSize, pageHeight - innerMargin)
      .lineWidth(3)
      .strokeColor('#d4af37')
      .stroke();

    // Правый нижний угол
    doc.moveTo(pageWidth - innerMargin - cornerSize, pageHeight - innerMargin)
      .lineTo(pageWidth - innerMargin, pageHeight - innerMargin)
      .lineTo(pageWidth - innerMargin, pageHeight - innerMargin - cornerSize)
      .lineWidth(3)
      .strokeColor('#d4af37')
      .stroke();

    // Декоративные линии по бокам
    for (let i = 0; i < 5; i++) {
      const y = innerMargin + cornerSize + (innerHeight - cornerSize * 2) / 6 * (i + 1);
      doc.moveTo(innerMargin + 20, y)
        .lineTo(innerMargin + 40, y)
        .lineWidth(1.5)
        .strokeColor('#d4af37')
        .stroke();

      doc.moveTo(pageWidth - innerMargin - 20, y)
        .lineTo(pageWidth - innerMargin - 40, y)
        .lineWidth(1.5)
        .strokeColor('#d4af37')
        .stroke();
    }

    // Декоративная печать вверху (эмблема)
    doc.circle(centerX, 120, 45)
      .lineWidth(4)
      .strokeColor('#d4af37')
      .stroke();
    
    doc.circle(centerX, 120, 35)
      .lineWidth(2)
      .strokeColor('#fbbf24')
      .stroke();

    // Звезда в центре печати
    const starSize = 20;
    const starX = centerX;
    const starY = 120;
    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
      const x = starX + Math.cos(angle) * starSize;
      const y = starY + Math.sin(angle) * starSize;
      if (i === 0) {
        doc.moveTo(x, y);
      } else {
        doc.lineTo(x, y);
      }
    }
    doc.closePath()
      .fillColor('#d4af37')
      .fill();

    // Заголовок СЕРТИФИКАТ (стилизованный)
    doc.fontSize(56)
      .fillColor('#1e293b')
      .font('Helvetica-Bold');
    doc.y = 200;
    doc.text('СЕРТИФИКАТ', { align: 'center' });

    // Декоративная линия под заголовком
    doc.moveTo(centerX - 150, 250)
      .lineTo(centerX - 50, 250)
      .lineWidth(2)
      .strokeColor('#d4af37')
      .stroke();

    doc.moveTo(centerX + 50, 250)
      .lineTo(centerX + 150, 250)
      .lineWidth(2)
      .strokeColor('#d4af37')
      .stroke();

    // Подзаголовок
    doc.fontSize(18)
      .fillColor('#64748b')
      .font('Helvetica-Oblique');
    doc.y = 270;
    doc.text('о завершении курса', { align: 'center' });

    // Имя пользователя (выделено)
    const userName = user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.username || 'Студент';

    doc.fontSize(36)
      .fillColor('#0f172a')
      .font('Helvetica-Bold');
    doc.y = 330;
    doc.text(userName, { align: 'center' });

    // Текст "успешно завершил(а) курс"
    doc.fontSize(20)
      .fillColor('#475569')
      .font('Helvetica');
    doc.y = 390;
    doc.text('успешно завершил(а) курс', { align: 'center' });

    // Название курса (в кавычках, стилизовано)
    doc.fontSize(26)
      .fillColor('#1e40af')
      .font('Helvetica-Bold');
    doc.y = 440;
    doc.text(`"${course.title}"`, { 
      align: 'center',
      width: pageWidth - 200,
    });

    // Дата завершения (стилизованная)
    const completedDate = new Date(certificate.completedAt).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    doc.fontSize(16)
      .fillColor('#64748b')
      .font('Helvetica');
    doc.y = 510;
    doc.text(`${completedDate} г.`, { align: 'center' });

    // Оценка (если есть) - в красивом блоке
    if (certificate.grade !== undefined) {
      const gradeX = centerX - 80;
      const gradeY = 550;
      doc.roundedRect(gradeX, gradeY, 160, 40, 8)
        .fillColor('#ecfdf5')
        .fill()
        .strokeColor('#10b981')
        .lineWidth(2)
        .stroke();

      doc.fontSize(18)
        .fillColor('#059669')
        .font('Helvetica-Bold');
      doc.y = gradeY + 12;
      doc.text(`Средняя оценка: ${certificate.grade}%`, { align: 'center' });
    }

    // Номер сертификата (внизу, мелким шрифтом)
    doc.fontSize(10)
      .fillColor('#94a3b8')
      .font('Helvetica');
    doc.y = pageHeight - 100;
    doc.text(`Номер сертификата: ${certificate.certificateNumber}`, { align: 'center' });

    // Подпись и печать внизу
    const signatureY = pageHeight - 60;
    
    // Левая подпись (имитация)
    doc.fontSize(11)
      .fillColor('#64748b')
      .font('Helvetica');
    doc.x = 150;
    doc.y = signatureY;
    doc.text('_________________________', { align: 'left' });
    doc.x = 150;
    doc.y = signatureY + 15;
    doc.text('Директор образовательной платформы', { align: 'left' });

    // Правая печать (декоративная)
    const sealX = pageWidth - 200;
    const sealY = signatureY - 10;
    doc.circle(sealX, sealY, 35)
      .lineWidth(2)
      .strokeColor('#dc2626')
      .stroke();
    
    doc.circle(sealX, sealY, 25)
      .lineWidth(1)
      .strokeColor('#dc2626')
      .stroke();

    doc.fontSize(8)
      .fillColor('#dc2626')
      .font('Helvetica-Bold');
    doc.x = sealX;
    doc.y = sealY - 5;
    doc.text('ПЕЧАТЬ', { align: 'center' });

    // Логотип/название платформы внизу по центру
    doc.fontSize(14)
      .fillColor('#6366f1')
      .font('Helvetica-Bold');
    doc.y = pageHeight - 40;
    doc.text('Кванториум система доп образования', { align: 'center' });

    // Декоративные элементы по углам (виньетки)
    const vignetteSize = 60;
    
    // Верхние виньетки
    doc.circle(innerMargin + 30, innerMargin + 30, vignetteSize / 2)
      .lineWidth(1.5)
      .strokeColor('#d4af37')
      .opacity(0.3)
      .stroke();

    doc.circle(pageWidth - innerMargin - 30, innerMargin + 30, vignetteSize / 2)
      .lineWidth(1.5)
      .strokeColor('#d4af37')
      .opacity(0.3)
      .stroke();

    // Нижние виньетки
    doc.circle(innerMargin + 30, pageHeight - innerMargin - 30, vignetteSize / 2)
      .lineWidth(1.5)
      .strokeColor('#d4af37')
      .opacity(0.3)
      .stroke();

    doc.circle(pageWidth - innerMargin - 30, pageHeight - innerMargin - 30, vignetteSize / 2)
      .lineWidth(1.5)
      .strokeColor('#d4af37')
      .opacity(0.3)
      .stroke();

    doc.end();
  });
}

