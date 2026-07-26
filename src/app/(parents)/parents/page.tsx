'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHero } from '@/components/ui/page-hero';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  GraduationCap,
  TrendingUp,
  Calendar,
  Award,
  AlertTriangle,
  ChevronRight,
  Eye,
} from 'lucide-react';

export default function ParentDashboardPage() {
  const [selectedChild, setSelectedChild] = useState('1');

  const children = [
    {
      id: '1',
      name: 'John Phiri',
      grade: 'Form 4',
      school: 'Lilongwe Secondary School',
      avatar: 'JP',
    },
    {
      id: '2',
      name: 'Grace Phiri',
      grade: 'Form 2',
      school: 'Lilongwe Secondary School',
      avatar: 'GP',
    },
  ];

  const childData = {
    attendance: 92,
    averageScore: 72,
    coursesEnrolled: 5,
    coursesCompleted: 3,
    upcomingExams: 2,
    recentScores: [
      { subject: 'Mathematics', score: 75, date: '2026-07-20' },
      { subject: 'Physics', score: 68, date: '2026-07-18' },
      { subject: 'English', score: 82, date: '2026-07-15' },
    ],
    subscriptions: {
      status: 'active',
      plan: 'Student Premium',
      renewalDate: '2026-08-01',
      amount: 10000,
    },
  };

  return (
    <div className="space-y-6">
      {/* Child Selector */}
      <div className="flex gap-4">
        {children.map((child) => (
          <button
            key={child.id}
            onClick={() => setSelectedChild(child.id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              selectedChild === child.id
                ? 'bg-navy text-white'
                : 'bg-white text-navy hover:bg-navy/5'
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
              selectedChild === child.id ? 'bg-white/20' : 'bg-navy/10'
            }`}>
              {child.avatar}
            </div>
            <div className="text-left">
              <p className="font-semibold">{child.name}</p>
              <p className="text-xs opacity-75">{child.grade} • {child.school}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="text-green" size={20} />
              </div>
              <div>
                <p className="text-xs text-grey-medium">Attendance</p>
                <p className="text-xl font-bold text-navy">{childData.attendance}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="text-blue-600" size={20} />
              </div>
              <div>
                <p className="text-xs text-grey-medium">Avg Score</p>
                <p className="text-xl font-bold text-navy">{childData.averageScore}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BookOpen className="text-purple-600" size={20} />
              </div>
              <div>
                <p className="text-xs text-grey-medium">Courses</p>
                <p className="text-xl font-bold text-navy">
                  {childData.coursesCompleted}/{childData.coursesEnrolled}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <GraduationCap className="text-yellow-600" size={20} />
              </div>
              <div>
                <p className="text-xs text-grey-medium">Upcoming Exams</p>
                <p className="text-xl font-bold text-navy">{childData.upcomingExams}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Scores */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Exam Scores</CardTitle>
              <Button variant="ghost" size="sm" rightIcon={<ChevronRight size={14} />}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {childData.recentScores.map((score, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-grey-light/50 rounded-lg">
                  <div>
                    <p className="font-medium text-navy">{score.subject}</p>
                    <p className="text-xs text-grey-medium">{new Date(score.date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-16 bg-grey-light rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          score.score >= 70 ? 'bg-green' : score.score >= 50 ? 'bg-yellow-500' : 'bg-red'
                        }`}
                        style={{ width: `${score.score}%` }}
                      />
                    </div>
                    <span className={`font-bold ${
                      score.score >= 70 ? 'text-green' : score.score >= 50 ? 'text-yellow-600' : 'text-red'
                    }`}>
                      {score.score}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Subscription Status */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="success">Active</Badge>
                  <span className="text-sm text-grey-medium">Renews {childData.subscriptions.renewalDate}</span>
                </div>
                <p className="font-semibold text-navy">{childData.subscriptions.plan}</p>
                <p className="text-sm text-grey-dark mt-1">
                  MWK {childData.subscriptions.amount.toLocaleString()}/month
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-navy text-sm">Included Features:</h4>
                {[
                  'Access to all courses',
                  'AI Tutor assistance',
                  'Live class participation',
                  'Mock examinations',
                  'Digital certificates',
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-grey-dark">
                    <div className="w-1.5 h-1.5 rounded-full bg-green" />
                    {feature}
                  </div>
                ))}
              </div>

              <Button variant="outline" fullWidth rightIcon={<Eye size={14} />}>
                View Payment History
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Certificates */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Award size={20} className="text-yellow-600" />
              Certificates Earned
            </CardTitle>
            <Button variant="ghost" size="sm">View All</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: 'Mathematics Excellence', date: '2026-06-15', type: 'DIGITAL' },
              { title: 'Physics Achievement', date: '2026-05-20', type: 'VERIFIED' },
            ].map((cert, i) => (
              <div key={i} className="p-4 border-2 border-grey-light rounded-xl">
                <Award size={32} className="text-yellow-600 mb-3" />
                <h4 className="font-semibold text-navy">{cert.title}</h4>
                <p className="text-sm text-grey-medium">
                  Issued: {new Date(cert.date).toLocaleDateString()}
                </p>
                <Badge variant={cert.type === 'VERIFIED' ? 'success' : 'neutral'} size="sm" className="mt-2">
                  {cert.type}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}