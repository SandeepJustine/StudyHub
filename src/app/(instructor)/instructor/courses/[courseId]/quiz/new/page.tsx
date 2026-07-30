'use client';
import { useState } from 'react'; import { useRouter } from 'next/navigation'; import { Button } from '@/components/ui/button'; import { Input } from '@/components/ui/input'; import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'; import { Badge } from '@/components/ui/badge'; import { Toast } from '@/components/ui/toast'; import { Plus, Trash2, ArrowLeft, Send, Loader2 } from 'lucide-react'; import Link from 'next/link';

export default function NewQuizPage({ params }: { params: { courseId: string } }) {
  const router = useRouter(); const [isLoading, setIsLoading] = useState(false); const [toast, setToast] = useState<{message:string;type:'success'|'error'}|null>(null);
  const [quizData, setQuizData] = useState({ title: '', description: '', timeLimit: '30', passingScore: '60', maxAttempts: '3', shuffleQuestions: true, moduleId: '' });
  const [questions, setQuestions] = useState<any[]>([{ id: '1', type: 'MULTIPLE_CHOICE', text: '', options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }], explanation: '', points: 5 }]);
  const [modules, setModules] = useState<any[]>([]);

  const addQuestion = () => setQuestions([...questions, { id: Date.now().toString(), type: 'MULTIPLE_CHOICE', text: '', options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }], explanation: '', points: 5 }]);
  const removeQuestion = (id: string) => setQuestions(questions.filter(q => q.id !== id));
  const updateQuestion = (id: string, field: string, value: any) => setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
  const updateOption = (qId: string, oIdx: number, field: string, value: any) => setQuestions(questions.map(q => q.id === qId ? { ...q, options: q.options.map((o:any,i:number) => i === oIdx ? { ...o, [field]: value } : o) } : q));

  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); setIsLoading(true);
    try { const res = await fetch(`/api/courses/${params.courseId}/quiz`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...quizData, passingScore: parseInt(quizData.passingScore), maxAttempts: parseInt(quizData.maxAttempts), timeLimit: parseInt(quizData.timeLimit), questions }) });
      if (!res.ok) throw new Error('Failed'); setToast({ message: 'Quiz created!', type: 'success' }); setTimeout(() => router.push(`/instructor/courses/${params.courseId}`), 1000);
    } catch { setToast({ message: 'Failed', type: 'error' }); } finally { setIsLoading(false); } };

  return (<div className="p-6 space-y-6 max-w-3xl"><div className="flex items-center gap-3"><Link href={`/instructor/courses/${params.courseId}`} className="text-grey-medium hover:text-navy"><ArrowLeft size={18} /></Link><div><h1 className="text-xl font-bold text-navy">Add Quiz</h1><p className="text-sm text-grey-medium">Create quiz for course module</p></div></div>
  <form onSubmit={handleSubmit} className="space-y-4"><Card className="border-0 shadow-sm"><CardHeader><CardTitle>Quiz Settings</CardTitle></CardHeader><CardContent className="space-y-3"><Input label="Quiz Title" placeholder="e.g., Chapter 1 Quiz" value={quizData.title} onChange={(e)=>setQuizData({...quizData,title:e.target.value})} required />
  <div className="grid grid-cols-3 gap-3"><Input label="Time Limit (min)" type="number" value={quizData.timeLimit} onChange={(e)=>setQuizData({...quizData,timeLimit:e.target.value})} /><Input label="Passing Score (%)" type="number" value={quizData.passingScore} onChange={(e)=>setQuizData({...quizData,passingScore:e.target.value})} /><Input label="Max Attempts" type="number" value={quizData.maxAttempts} onChange={(e)=>setQuizData({...quizData,maxAttempts:e.target.value})} /></div>
  <label className="flex items-center gap-2"><input type="checkbox" checked={quizData.shuffleQuestions} onChange={(e)=>setQuizData({...quizData,shuffleQuestions:e.target.checked})} /><span className="text-sm">Shuffle questions</span></label></CardContent></Card>

  {questions.map((q, qi) => (<Card key={q.id} className="border-0 shadow-sm"><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Question {qi + 1}</CardTitle><button type="button" onClick={()=>removeQuestion(q.id)} className="text-red"><Trash2 size={14} /></button></CardHeader><CardContent className="space-y-3">
  <Input placeholder="Question text" value={q.text} onChange={(e)=>updateQuestion(q.id,'text',e.target.value)} required />
  <div className="grid grid-cols-2 gap-2">{q.options.map((opt:any, oi:number)=>(<div key={oi} className="flex items-center gap-2"><input type="radio" name={`correct-${q.id}`} checked={opt.isCorrect} onChange={()=>{ q.options.forEach((_:any,i:number)=>updateOption(q.id,i,'isCorrect',i===oi)); }} /><Input placeholder={`Option ${oi+1}`} value={opt.text} onChange={(e)=>updateOption(q.id,oi,'text',e.target.value)} className="flex-1" /></div>))}</div>
  <Input label="Points" type="number" value={q.points} onChange={(e)=>updateQuestion(q.id,'points',parseInt(e.target.value))} /></CardContent></Card>))}
  <Button type="button" variant="outline" onClick={addQuestion} leftIcon={<Plus size={14} />}>Add Question</Button>
  <Button type="submit" variant="primary" size="lg" disabled={isLoading}>{isLoading?<Loader2 size={14} className="animate-spin mr-1" />:<Send size={14} className="mr-1" />}Create Quiz</Button></form>
  {toast&&<Toast message={toast.message} type={toast.type} onClose={()=>setToast(null)} />}</div>);}
