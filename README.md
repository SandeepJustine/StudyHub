# StudyHub Malawi

<div align="center">
  <img src="public/logo-color.svg" alt="StudyHub Malawi" width="200" />
  <h3>Learn. Practice. Succeed.</h3>
</div>

## Overview

StudyHub is a multi-sided digital learning and examination platform built for Malawi's educational ecosystem. It supports five distinct user roles and provides comprehensive tools for online learning, examinations, and institutional management.

### User Roles
- **Student** - MSCE/JCE, ICAM, TEVETA, or professional-board learner
- **School Admin** - Manages branded institutional portal (Bronze/Silver/Gold tier)
- **Instructor** - Creates/sells courses, tracks revenue share
- **Corporate Client** - Buys training packages, posts recruitment vacancies
- **Platform Admin** - Manages pricing, payouts, sponsorships, KPIs

### Tech Stack
- **Frontend**: Next.js 14, React 18, TailwindCSS, Recharts
- **Backend**: Next.js API Routes, Prisma ORM, PostgreSQL
- **Authentication**: NextAuth.js with JWT
- **Email**: React Email, Nodemailer
- **Payments**: Airtel Money, TNM Mpamba, PayChangu, Bank Transfer
- **Real-time**: Socket.io
- **AI**: OpenAI API integration

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm
- PostgreSQL 15+
- Redis (optional, for caching)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/studyhub-malawi.git
cd studyhub-malawi
