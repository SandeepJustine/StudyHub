// Email template components for StudyHub Malawi
// These are placeholder components that return HTML strings
// Replace with proper React Email components when ready

export function PaymentConfirmationEmail(props: any) {
  const { userName = 'Student', amount = 0, planName = '', transactionReference = '', date = new Date().toLocaleDateString() } = props;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Payment Confirmed</title></head><body style="font-family:Arial,sans-serif;background:#f2f4f7;padding:20px"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden"><div style="background:#0D1B3D;padding:20px;text-align:center"><h1 style="color:#fff;margin:0">StudyHub Malawi</h1></div><div style="padding:30px"><h2 style="color:#0D1B3D">Payment Confirmed! 🎉</h2><p>Dear ${userName},</p><p>Your payment of <strong>MWK ${amount.toLocaleString()}</strong> for <strong>${planName}</strong> has been confirmed.</p><div style="background:#f2f4f7;padding:15px;border-radius:8px;margin:15px 0"><p><strong>Reference:</strong> ${transactionReference}</p><p><strong>Date:</strong> ${date}</p></div><p>You now have access to all features included in your plan.</p><a href="https://studyhub.mw/dashboard" style="display:inline-block;background:#E63946;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px">Go to Dashboard</a></div></div></body></html>`;
}

export function WelcomeEmail(props: any) {
  const { userName = 'Student', role = 'Student' } = props;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Welcome to StudyHub</title></head><body style="font-family:Arial,sans-serif;background:#f2f4f7;padding:20px"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden"><div style="background:#0D1B3D;padding:20px;text-align:center"><h1 style="color:#fff;margin:0">StudyHub Malawi</h1></div><div style="padding:30px"><h2 style="color:#0D1B3D">Welcome to StudyHub, ${userName}! 🎉</h2><p>Your ${role.toLowerCase()} account is ready. Start your learning journey today!</p><a href="https://studyhub.mw/dashboard" style="display:inline-block;background:#E63946;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px">Get Started</a></div></div></body></html>`;
}

export function OTPVerificationEmail(props: any) {
  const { userName = 'Student', otp = '000000', purpose = 'verify your account', expiryMinutes = 10 } = props;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Verification Code</title></head><body style="font-family:Arial,sans-serif;background:#f2f4f7;padding:20px"><div style="max-width:480px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden"><div style="background:#0D1B3D;padding:20px;text-align:center"><h1 style="color:#fff;margin:0">StudyHub Malawi</h1></div><div style="padding:30px;text-align:center"><h2 style="color:#0D1B3D">Verification Code</h2><p>Hello ${userName},</p><p>Use the code below to ${purpose}:</p><div style="background:#0D1B3D;padding:20px;border-radius:8px;margin:20px 0"><span style="font-size:36px;font-weight:bold;color:#fff;letter-spacing:8px">${otp}</span></div><p style="color:#E63946">This code expires in ${expiryMinutes} minutes.</p><p style="color:#666">Never share this code with anyone.</p></div></div></body></html>`;
}

export function ExamResultEmail(props: any) {
  const { userName = 'Student', quizTitle = '', score = 0, passed = false } = props;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Exam Result</title></head><body style="font-family:Arial,sans-serif;background:#f2f4f7;padding:20px"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden"><div style="background:#0D1B3D;padding:20px;text-align:center"><h1 style="color:#fff;margin:0">StudyHub Malawi</h1></div><div style="padding:30px"><h2 style="color:#0D1B3D">Exam Result: ${quizTitle}</h2><p>Dear ${userName},</p><p>You scored <strong style="color:${passed ? '#16A34A' : '#E63946'};font-size:24px">${score}%</strong></p><p>${passed ? '🎉 Congratulations! You passed!' : '💪 Keep practicing! You can retake the exam.'}</p></div></div></body></html>`;
}

export function RenewalReminderEmail(props: any) {
  const { userName = 'Student', tier = '', amount = 0, endDate = '', daysRemaining = 0 } = props;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Subscription Renewal</title></head><body style="font-family:Arial,sans-serif;background:#f2f4f7;padding:20px"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden"><div style="background:#0D1B3D;padding:20px;text-align:center"><h1 style="color:#fff;margin:0">StudyHub Malawi</h1></div><div style="padding:30px"><h2 style="color:#0D1B3D">Subscription Renewing Soon</h2><p>Dear ${userName},</p><p>Your <strong>${tier}</strong> subscription (MWK ${amount.toLocaleString()}) will renew on <strong>${endDate}</strong>.</p><p>Days remaining: <strong>${daysRemaining}</strong></p></div></div></body></html>`;
}

export function PasswordResetEmail(props: any) {
  const { userName = 'Student', resetLink = '#' } = props;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Password Reset</title></head><body style="font-family:Arial,sans-serif;background:#f2f4f7;padding:20px"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden"><div style="background:#0D1B3D;padding:20px;text-align:center"><h1 style="color:#fff;margin:0">StudyHub Malawi</h1></div><div style="padding:30px"><h2 style="color:#0D1B3D">Password Reset Request</h2><p>Dear ${userName},</p><p>Click the button below to reset your password:</p><a href="${resetLink}" style="display:inline-block;background:#E63946;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px">Reset Password</a><p style="color:#666;margin-top:20px">If you didn't request this, please ignore this email.</p></div></div></body></html>`;
}

export function AccountVerificationEmail(props: any) {
  const { userName = 'Student', verificationLink = '#' } = props;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Verify Your Account</title></head><body style="font-family:Arial,sans-serif;background:#f2f4f7;padding:20px"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden"><div style="background:#0D1B3D;padding:20px;text-align:center"><h1 style="color:#fff;margin:0">StudyHub Malawi</h1></div><div style="padding:30px"><h2 style="color:#0D1B3D">Verify Your Email</h2><p>Dear ${userName},</p><p>Click below to verify your email address:</p><a href="${verificationLink}" style="display:inline-block;background:#E63946;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px">Verify Email</a></div></div></body></html>`;
}

export function GenericNotificationEmail(props: any) {
  const { userName = 'Student', title = 'Notification', message = '' } = props;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title></head><body style="font-family:Arial,sans-serif;background:#f2f4f7;padding:20px"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden"><div style="background:#0D1B3D;padding:20px;text-align:center"><h1 style="color:#fff;margin:0">StudyHub Malawi</h1></div><div style="padding:30px"><h2 style="color:#0D1B3D">${title}</h2><p>Dear ${userName},</p><p>${message}</p></div></div></body></html>`;
}

export function SubscriptionReceiptEmail(props: any) {
  const { userName = 'Student', tier = '', amount = 0, period = '', startDate = '', endDate = '' } = props;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Subscription Receipt</title></head><body style="font-family:Arial,sans-serif;background:#f2f4f7;padding:20px"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden"><div style="background:#0D1B3D;padding:20px;text-align:center"><h1 style="color:#fff;margin:0">StudyHub Malawi</h1></div><div style="padding:30px"><h2 style="color:#0D1B3D">Subscription Receipt</h2><p>Dear ${userName},</p><p>Your <strong>${tier}</strong> subscription has been activated.</p><div style="background:#f2f4f7;padding:15px;border-radius:8px;margin:15px 0"><p><strong>Amount:</strong> MWK ${amount.toLocaleString()}</p><p><strong>Period:</strong> ${period}</p><p><strong>Start:</strong> ${startDate}</p><p><strong>End:</strong> ${endDate}</p></div></div></div></body></html>`;
}

export function CourseEnrollmentEmail(props: any) {
  const { userName = 'Student', courseTitle = '', subject = '' } = props;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Course Enrollment</title></head><body style="font-family:Arial,sans-serif;background:#f2f4f7;padding:20px"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden"><div style="background:#0D1B3D;padding:20px;text-align:center"><h1 style="color:#fff;margin:0">StudyHub Malawi</h1></div><div style="padding:30px"><h2 style="color:#0D1B3D">You're Enrolled! 🎉</h2><p>Dear ${userName},</p><p>You've successfully enrolled in <strong>${courseTitle}</strong> (${subject}).</p><p>Start learning today!</p></div></div></body></html>`;
}

export function ClassReminderEmail(props: any) {
  const { userName = 'Student', classTitle = '', date = '', time = '', link = '#' } = props;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Class Reminder</title></head><body style="font-family:Arial,sans-serif;background:#f2f4f7;padding:20px"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden"><div style="background:#0D1B3D;padding:20px;text-align:center"><h1 style="color:#fff;margin:0">StudyHub Malawi</h1></div><div style="padding:30px"><h2 style="color:#0D1B3D">Class Reminder ⏰</h2><p>Dear ${userName},</p><p><strong>${classTitle}</strong> is scheduled for <strong>${date}</strong> at <strong>${time}</strong>.</p><a href="${link}" style="display:inline-block;background:#E63946;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px">Join Class</a></div></div></body></html>`;
}

export function InstructorPayoutEmail(props: any) {
  const { userName = 'Instructor', amount = 0, period = '', reference = '' } = props;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Payout Processed</title></head><body style="font-family:Arial,sans-serif;background:#f2f4f7;padding:20px"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden"><div style="background:#0D1B3D;padding:20px;text-align:center"><h1 style="color:#fff;margin:0">StudyHub Malawi</h1></div><div style="padding:30px"><h2 style="color:#0D1B3D">Payout Processed 💰</h2><p>Dear ${userName},</p><p>Your payout of <strong>MWK ${amount.toLocaleString()}</strong> for <strong>${period}</strong> has been processed.</p><p>Reference: ${reference}</p></div></div></body></html>`;
}

export function CertificateIssuedEmail(props: any) {
  const { userName = 'Student', certificateTitle = '', verificationId = '' } = props;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Certificate Issued</title></head><body style="font-family:Arial,sans-serif;background:#f2f4f7;padding:20px"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden"><div style="background:#0D1B3D;padding:20px;text-align:center"><h1 style="color:#fff;margin:0">StudyHub Malawi</h1></div><div style="padding:30px"><h2 style="color:#0D1B3D">Certificate Issued! 🎓</h2><p>Dear ${userName},</p><p>Your certificate <strong>${certificateTitle}</strong> has been issued.</p><p>Verification ID: <strong>${verificationId}</strong></p></div></div></body></html>`;
}

export function JobApplicationEmail(props: any) {
  const { userName = 'Student', jobTitle = '', companyName = '' } = props;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Application Submitted</title></head><body style="font-family:Arial,sans-serif;background:#f2f4f7;padding:20px"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden"><div style="background:#0D1B3D;padding:20px;text-align:center"><h1 style="color:#fff;margin:0">StudyHub Malawi</h1></div><div style="padding:30px"><h2 style="color:#0D1B3D">Application Submitted</h2><p>Dear ${userName},</p><p>Your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been submitted.</p></div></div></body></html>`;
}

export function EventRegistrationEmail(props: any) {
  const { userName = 'Student', eventTitle = '', date = '', venue = '' } = props;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Event Registration</title></head><body style="font-family:Arial,sans-serif;background:#f2f4f7;padding:20px"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden"><div style="background:#0D1B3D;padding:20px;text-align:center"><h1 style="color:#fff;margin:0">StudyHub Malawi</h1></div><div style="padding:30px"><h2 style="color:#0D1B3D">Event Registration Confirmed</h2><p>Dear ${userName},</p><p>You're registered for <strong>${eventTitle}</strong> on <strong>${date}</strong>.</p><p>Venue: ${venue || 'Online'}</p></div></div></body></html>`;
}
