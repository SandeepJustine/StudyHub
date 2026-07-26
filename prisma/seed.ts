import { PrismaClient, UserRole, SubscriptionTier, BillingCycle } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  const password = await bcrypt.hash('password123', 12);

  // ============================================
  // CREATE USERS
  // ============================================
  
  console.log('Creating users...');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@studyhub.mw' },
    update: {},
    create: {
      email: 'admin@studyhub.mw',
      phone: '+265888000001',
      passwordHash: password,
      fullName: 'Platform Administrator',
      role: UserRole.PLATFORM_ADMIN,
      emailVerified: new Date(),
      locale: 'en',
    },
  });
  console.log('  ✅ Admin');

  const studentUser = await prisma.user.upsert({
    where: { email: 'student@studyhub.mw' },
    update: {},
    create: {
      email: 'student@studyhub.mw',
      phone: '+265888000002',
      passwordHash: password,
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
    update: {},
    create: {
      email: 'school@studyhub.mw',
      phone: '+265888000003',
      passwordHash: password,
      fullName: 'Sarah SchoolAdmin',
      role: UserRole.SCHOOL_ADMIN,
      emailVerified: new Date(),
      locale: 'en',
    },
  });
  console.log('  ✅ School Admin');

  const instructorUser = await prisma.user.upsert({
    where: { email: 'instructor@studyhub.mw' },
    update: {},
    create: {
      email: 'instructor@studyhub.mw',
      phone: '+265888000004',
      passwordHash: password,
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
    where: { email: 'corporate@studyhub.mw' },
    update: {},
    create: {
      email: 'corporate@studyhub.mw',
      phone: '+265888000005',
      passwordHash: password,
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
    where: { email: 'parent@studyhub.mw' },
    update: {},
    create: {
      email: 'parent@studyhub.mw',
      phone: '+265888000006',
      passwordHash: password,
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
    where: { slug: 'lilongwe-secondary' },
    update: {},
    create: {
      name: 'Lilongwe Secondary School',
      slug: 'lilongwe-secondary',
      tier: SubscriptionTier.INSTITUTION_BRONZE,
      maxStudents: 200,
      currentStudents: 0,
      settings: {
        contactPhone: '+265111000000',
        contactEmail: 'info@lilongwesec.mw',
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
  }

  const existingInstSub = await prisma.subscription.findFirst({
    where: { institutionId: institution.id, status: 'active' },
  });
  if (!existingInstSub) {
    await prisma.subscription.create({
      data: {
        userId: schoolAdmin.id,
        institutionId: institution.id,
        tier: SubscriptionTier.INSTITUTION_BRONZE,
        cycle: BillingCycle.MONTHLY,
        status: 'active',
        amount: 100000,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        autoRenew: true,
      },
    });
    console.log('  ✅ Institution subscription');
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
  }

  console.log('  ✅ Subscriptions checked/created\n');

  // ============================================
  // SUMMARY
  // ============================================

  console.log('='.repeat(60));
  console.log('🎉 SEED COMPLETED SUCCESSFULLY');
  console.log('='.repeat(60));
  console.log('');
  console.log('📋 Test Accounts (password: password123):');
  console.log('  Admin:      admin@studyhub.mw');
  console.log('  Student:    student@studyhub.mw');
  console.log('  School:     school@studyhub.mw');
  console.log('  Instructor: instructor@studyhub.mw');
  console.log('  Corporate:  corporate@studyhub.mw');
  console.log('  Parent:     parent@studyhub.mw');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

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
  await prisma.corporateContract.deleteMany();
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
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();
  console.log('Database cleaned');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });