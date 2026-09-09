import { PrismaClient, UserRole, SubscriptionTier, BillingCycle } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { DEFAULT_CERTIFICATE_TEMPLATE } from '../src/lib/certificates/default-template';

const prisma = new PrismaClient();

async function cleanDatabase() {
  // Delete in order to respect foreign key constraints
  await prisma.activityLog.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.supportResponse.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.forumPost.deleteMany();
  await prisma.forumThread.deleteMany();
  await prisma.jobApplication.deleteMany();
  await prisma.recruitmentPosting.deleteMany();
   await prisma.corporateTrainingPackage.deleteMany();
   await prisma.eventRegistration.deleteMany();
  await prisma.event.deleteMany();
  await prisma.liveClass.deleteMany();
  await prisma.assignmentSubmission.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.examAttempt.deleteMany();
  await prisma.question.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.courseReview.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.courseModule.deleteMany();
  await prisma.course.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.payout.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.parentLink.deleteMany();
  await prisma.parent.deleteMany();
  await prisma.corporateClient.deleteMany();
  await prisma.instructor.deleteMany();
  await prisma.schoolAdmin.deleteMany();
  await prisma.student.deleteMany();
  await prisma.institutionBranding.deleteMany();
  await prisma.institution.deleteMany();
  await prisma.promoCode.deleteMany();
  // await prisma.session.deleteMany();
  // await prisma.account.deleteMany();
  // await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();
  console.log('Database cleaned');
}

async function main() {
  console.log('🌱 Starting database seed...\n');

  const PASSWORD = 'StudyHubMW!@2063';
  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  // Uncomment to wipe all data before reseeding:
  // await cleanDatabase();

  // ============================================
  // CREATE USERS
  // ============================================

  console.log('Creating users...');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@studyhub.mw' },
    update: { passwordHash },
    create: {
      email: 'admin@studyhub.mw',
      phone: '+265888000001',
      passwordHash,
      fullName: 'Platform Administrator',
      role: UserRole.PLATFORM_ADMIN,
      emailVerified: new Date(),
      locale: 'en',
    },
  });
  console.log('  ✅ Admin');

  const studentUser = await prisma.user.upsert({
    where: { email: 'student@studyhub.mw' },
    update: { passwordHash },
    create: {
      email: 'student@studyhub.mw',
      phone: '+265888000002',
      passwordHash,
      fullName: 'John Student',
      role: UserRole.STUDENT,
      emailVerified: new Date(),
      locale: 'en',
    },
  });

  const student = await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      userId: studentUser.id,
      grade: 'Form 4',
      examBoard: 'MSCE',
      subjects: ['Mathematics', 'English', 'Physics', 'Biology'],
    },
  });
  console.log('  ✅ Student');

  const schoolAdmin = await prisma.user.upsert({
    where: { email: 'school@studyhub.mw' },
    update: { passwordHash },
    create: {
      email: 'school@studyhub.mw',
      phone: '+265888000003',
      passwordHash,
      fullName: 'Sarah SchoolAdmin',
      role: UserRole.SCHOOL_ADMIN,
      emailVerified: new Date(),
      locale: 'en',
    },
  });
  console.log('  ✅ School Admin');

  const instructorUser = await prisma.user.upsert({
    where: { email: 'instructor@studyhubmw.com' },
    update: { passwordHash },
    create: {
      email: 'instructor@studyhubmw.com',
      phone: '+265888000004',
      passwordHash,
      fullName: 'Prof. Michael Instructor',
      role: UserRole.INSTRUCTOR,
      emailVerified: new Date(),
      locale: 'en',
    },
  });

  const instructor = await prisma.instructor.upsert({
    where: { userId: instructorUser.id },
    update: {},
    create: {
      userId: instructorUser.id,
      bio: 'Experienced mathematics teacher with 10+ years of experience',
      expertise: ['Mathematics', 'Physics'],
      revenueShare: 0.70,
    },
  });
  console.log('  ✅ Instructor');

  const corporateUser = await prisma.user.upsert({
    where: { email: 'corporate@studyhubmw.com' },
    update: { passwordHash },
    create: {
      email: 'corporate@studyhubmw.com',
      phone: '+265888000005',
      passwordHash,
      fullName: 'David Corporate',
      role: UserRole.CORPORATE_CLIENT,
      emailVerified: new Date(),
      locale: 'en',
    },
  });

  await prisma.corporateClient.upsert({
    where: { userId: corporateUser.id },
    update: {},
    create: {
      userId: corporateUser.id,
      companyName: 'First Capital Bank',
      industry: 'Banking',
    },
  });
  console.log('  ✅ Corporate Client');

  const parentUser = await prisma.user.upsert({
    where: { email: 'parent@studyhubmw.com' },
    update: { passwordHash },
    create: {
      email: 'parent@studyhubmw.com',
      phone: '+265888000006',
      passwordHash,
      fullName: 'Mary Parent',
      role: UserRole.PARENT,
      emailVerified: new Date(),
      locale: 'en',
    },
  });

  await prisma.parent.upsert({
    where: { userId: parentUser.id },
    update: {},
    create: {
      userId: parentUser.id,
      phoneVerified: true,
    },
  });
  console.log('  ✅ Parent');

  console.log('✅ Users created\n');

  // ============================================
  // CREATE INSTITUTION
  // ============================================

  console.log('Creating institution...');

  const institution = await prisma.institution.upsert({
    where: { slug: 'studyhub-academy' },
    update: {},
    create: {
      name: 'StudyHub Academy',
      slug: 'studyhub-academy',
      tier: SubscriptionTier.INSTITUTION_GOLD,
      maxStudents: 1000,
      currentStudents: 0,
      settings: {
        contactPhone: '+265997011620',
        contactEmail: 'info@studyhubmw.com',
      },
    },
  });
  console.log('  ✅ Institution');

  await prisma.schoolAdmin.upsert({
    where: { userId: schoolAdmin.id },
    update: { institutionId: institution.id, role: 'HEAD' },
    create: {
      userId: schoolAdmin.id,
      institutionId: institution.id,
      role: 'HEAD',
    },
  });
  console.log('  ✅ School Admin linked\n');

  // ============================================
  // SUBSCRIPTIONS
  // ============================================

  console.log('Creating subscriptions...');

  const existingStudentSub = await prisma.subscription.findFirst({
    where: { userId: studentUser.id, status: 'active' },
  });
  if (!existingStudentSub) {
    await prisma.subscription.create({
      data: {
        userId: studentUser.id,
        tier: SubscriptionTier.STUDENT_PREMIUM,
        cycle: BillingCycle.MONTHLY,
        status: 'active',
        amount: 10000,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        autoRenew: true,
      },
    });
    console.log('  ✅ Student subscription');
  } else {
    console.log('  ℹ️  Student subscription already exists');
  }

  const existingInstSub = await prisma.subscription.findFirst({
    where: { userId: schoolAdmin.id, status: 'active' },
  });
  if (!existingInstSub) {
    await prisma.subscription.create({
      data: {
        userId: schoolAdmin.id,
        institutionId: institution.id,
        tier: SubscriptionTier.INSTITUTION_GOLD,
        cycle: BillingCycle.MONTHLY,
        status: 'active',
        amount: 100000,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        autoRenew: true,
      },
    });
    console.log('  ✅ Institution subscription');
  } else {
    console.log('  ℹ️  Institution subscription already exists');
  }

  const existingInstructorSub = await prisma.subscription.findFirst({
    where: { userId: instructorUser.id, status: 'active' },
  });
  if (!existingInstructorSub) {
    await prisma.subscription.create({
      data: {
        userId: instructorUser.id,
        tier: SubscriptionTier.INSTRUCTOR_FREE,
        cycle: BillingCycle.MONTHLY,
        status: 'active',
        amount: 0,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        autoRenew: true,
      },
    });
    console.log('  ✅ Instructor subscription');
  } else {
    console.log('  ℹ️  Instructor subscription already exists');
  }

  console.log('  ✅ Subscriptions checked/created\n');

  // ============================================
  // CERTIFICATE TEMPLATES
  // ============================================

  console.log('Creating certificate templates...');

  const existingDefaultTemplate = await prisma.certificateTemplate.findFirst({
    where: { isDefault: true },
  });

  if (!existingDefaultTemplate) {
    await prisma.certificateTemplate.create({
      data: {
        name: DEFAULT_CERTIFICATE_TEMPLATE.name,
        description: DEFAULT_CERTIFICATE_TEMPLATE.description,
        designConfig: DEFAULT_CERTIFICATE_TEMPLATE.designConfig,
        createdBy: admin.id,
        createdByRole: 'PLATFORM_ADMIN',
        isDefault: true,
        isActive: true,
      },
    });
    console.log('  ✅ Default certificate template created');
  } else {
    console.log('  ℹ️  Default template already exists');
  }

  console.log('  ✅ Certificate templates checked/created\n');

  // ============================================
  // VERIFICATION
  // ============================================

  console.log('Verifying seed data...');

  const counts = {
    users: await prisma.user.count(),
    students: await prisma.student.count(),
    instructors: await prisma.instructor.count(),
    institutions: await prisma.institution.count(),
    schoolAdmins: await prisma.schoolAdmin.count(),
    corporateClients: await prisma.corporateClient.count(),
    parents: await prisma.parent.count(),
    subscriptions: await prisma.subscription.count(),
    certificateTemplates: await prisma.certificateTemplate.count(),
  };

  console.log('  📊 Counts:', counts);

  const minimumExpected = {
    users: 6,
    students: 1,
    instructors: 1,
    institutions: 1,
    schoolAdmins: 1,
    corporateClients: 1,
    parents: 1,
    subscriptions: 3,
    certificateTemplates: 1,
  };

  const mismatches: string[] = [];
  for (const [key, minimumCount] of Object.entries(minimumExpected)) {
    const actual = counts[key as keyof typeof counts];
    if (actual < minimumCount) {
      mismatches.push(`${key}: expected at least ${minimumCount}, got ${actual}`);
    }
  }

  if (mismatches.length > 0) {
    console.error('❌ Seed verification failed:');
    mismatches.forEach(m => console.error('  -', m));
    process.exit(1);
  }

  console.log('  ✅ Minimum counts verified\n');

  // Verify specific users
  const expectedEmails = [
    'admin@studyhub.mw',
    'student@studyhub.mw',
    'school@studyhub.mw',
    'instructor@studyhubmw.com',
    'corporate@studyhubmw.com',
    'parent@studyhubmw.com',
  ];

  const users = await prisma.user.findMany({
    where: { email: { in: expectedEmails } },
    select: { email: true, role: true },
  });

  const foundEmails = users.map(u => u.email).sort();
  const sortedExpected = [...expectedEmails].sort();

  if (JSON.stringify(foundEmails) !== JSON.stringify(sortedExpected)) {
    console.error('❌ Missing or extra users found');
    console.error('  Expected:', sortedExpected);
    console.error('  Found:', foundEmails);
    process.exit(1);
  }

  console.log('  ✅ All expected users verified\n');

  // ============================================
  // SUMMARY
  // ============================================

  console.log('='.repeat(60));
  console.log('🎉 SEED COMPLETED SUCCESSFULLY');
  console.log('='.repeat(60));
  console.log('');
  console.log(`📋 Test Accounts (password: ${PASSWORD})`);
  console.log('  Admin:      admin@studyhub.mw');
  console.log('  Student:    student@studyhub.mw');
  console.log('  School:     school@studyhub.mw');
  console.log('  Instructor: instructor@studyhubmw.com');
  console.log('  Corporate:  corporate@studyhubmw.com');
  console.log('  Parent:     parent@studyhubmw.com');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });