import { UploadForm } from '@/components/upload-form'
import {
  ArrowDown,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  FileUp,
  Link2,
  MousePointer2,
  Presentation,
  Sparkles,
} from 'lucide-react'

export const metadata = {
  title: 'Presentation Share | Present together, from anywhere',
  description: 'Upload a PowerPoint, share a viewer link, and guide your audience through your slides.',
}

const steps = [
  { number: '01', icon: FileUp, title: 'Bring your slides', description: 'Upload your PowerPoint and choose how long your session stays active.' },
  { number: '02', icon: Link2, title: 'Invite your audience', description: 'Copy a viewer link and share it with the people following along.' },
  { number: '03', icon: MousePointer2, title: 'Lead the way', description: 'Move through your deck while your audience follows from their own screens.' },
]

function PresentationIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-[580px]" aria-label="Illustration of the presenter and viewer experience" role="img">
      <div aria-hidden="true" className="absolute -left-8 top-12 h-40 w-40 rounded-full bg-indigo-400/15 blur-3xl" />
      <div aria-hidden="true" className="absolute -right-4 bottom-0 h-48 w-48 rounded-full bg-violet-500/15 blur-3xl" />
      <div className="relative overflow-hidden rounded-[20px] border border-white/15 bg-[#f7f8fc] p-2 shadow-[0_30px_80px_rgba(1,4,20,0.4)] sm:p-3">
        <div className="flex h-10 items-center justify-between px-2 sm:px-3">
          <div className="flex items-center gap-2"><span className="flex size-6 items-center justify-center rounded-md bg-indigo-600 text-white"><Presentation className="size-3.5" /></span><span className="text-[10px] font-bold tracking-tight text-[#252a3c] sm:text-xs">Presenter workspace</span></div>
          <span className="rounded-md bg-indigo-600 px-2.5 py-1 text-[9px] font-semibold text-white">Present</span>
        </div>
        <div className="grid grid-cols-[1fr_25%] gap-2 rounded-xl bg-[#eef0f6] p-2 sm:gap-3 sm:p-3">
          <div className="min-w-0">
            <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-[#191c33] p-4 text-white sm:p-7">
              <div className="absolute -right-8 -top-10 size-36 rounded-full border border-white/10 sm:size-52" />
              <div className="absolute -right-1 -top-3 size-24 rounded-full border border-white/10 sm:size-36" />
              <p className="text-[7px] font-semibold uppercase tracking-[.2em] text-indigo-300 sm:text-[9px]">Ideas worth sharing</p>
              <p className="mt-4 max-w-[210px] text-lg font-semibold leading-[1.1] tracking-tight sm:mt-7 sm:text-3xl">A little more<br />in sync.</p>
              <div className="mt-4 h-1 w-10 rounded-full bg-indigo-400 sm:mt-6 sm:w-14" />
              <div className="absolute bottom-3 left-4 text-[7px] text-white/45 sm:bottom-5 sm:left-7 sm:text-[9px]">YOUR NEXT BIG IDEA &nbsp; / &nbsp; 01</div>
            </div>
            <div className="mt-2 flex items-center justify-between rounded-lg bg-white px-2 py-1.5 sm:px-3 sm:py-2"><span className="text-[8px] font-medium text-[#9ba1b0]">Current slide</span><span className="flex items-center gap-2 text-[8px] font-semibold text-[#61687a]"><ChevronLeft className="size-3" /> 01 / 08 <ChevronRight className="size-3" /></span></div>
          </div>
          <div className="space-y-2"><div className="rounded-lg bg-white p-2 sm:p-3"><span className="flex size-5 items-center justify-center rounded-md bg-indigo-50 text-indigo-600"><Link2 className="size-3" /></span><p className="mt-2 text-[8px] font-semibold text-[#33394c] sm:text-[10px]">Invite your audience</p><div className="mt-2 h-3 rounded bg-[#f2f3f8]" /><div className="mt-1.5 rounded bg-indigo-600 py-1 text-center text-[7px] font-semibold text-white">Copy viewer link</div></div><div className="rounded-lg bg-white p-2 sm:p-3"><p className="text-[8px] font-semibold text-[#33394c] sm:text-[10px]">Session details</p><div className="mt-2 h-1 w-4/5 rounded bg-[#eceef4]" /><div className="mt-1.5 h-1 w-3/5 rounded bg-[#eceef4]" /></div></div>
        </div>
      </div>
      <div className="absolute -bottom-5 -left-2 flex items-center gap-2 rounded-xl border border-[#e8e9f1] bg-white px-3 py-2.5 shadow-[0_10px_35px_rgba(7,10,30,0.2)] sm:-left-6 sm:px-4"><span className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><Check className="size-4" /></span><div><p className="text-[10px] font-semibold text-[#292e40] sm:text-xs">One link for everyone</p><p className="text-[9px] text-[#9298a8] sm:text-[10px]">An easier way to follow along</p></div></div>
      <p className="mt-7 text-right text-[10px] text-white/40">Illustration of the presentation workspace</p>
    </div>
  )
}

export default function Page() {
  return (
    <main className="min-h-screen bg-white text-[#202436]">
      <div className="overflow-hidden bg-[#111426] text-white">
        <header className="mx-auto flex h-[76px] max-w-[1280px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
          <a href="#top" className="inline-flex items-center gap-2.5 text-sm font-semibold tracking-tight"><span className="flex size-9 items-center justify-center rounded-xl bg-indigo-500 text-white"><Presentation className="size-[18px]" /></span>Presentation<span className="text-indigo-300">Share</span></a>
          <nav aria-label="Main navigation" className="flex items-center gap-5 sm:gap-8"><a href="#how-it-works" className="hidden text-sm font-medium text-white/60 transition-colors hover:text-white sm:block">How it works</a><a href="#upload" className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-xs font-semibold text-[#1d2134] transition-colors hover:bg-indigo-50 sm:text-sm">Get started <ArrowRight className="size-4" /></a></nav>
        </header>

        <section id="top" className="relative mx-auto grid max-w-[1280px] items-center gap-12 px-5 pb-20 pt-14 sm:px-8 sm:pb-24 sm:pt-20 lg:grid-cols-[1fr_1.04fr] lg:gap-16 lg:px-10 lg:pb-28 lg:pt-24">
          <div className="relative z-10 max-w-[610px]">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/25 bg-indigo-400/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[.13em] text-indigo-200"><Sparkles className="size-3.5" /> A better way to follow along</div>
            <h1 className="mt-6 text-[2.85rem] font-semibold leading-[1.04] tracking-[-0.045em] sm:text-[4.2rem] lg:text-[4.6rem]">Your slides.<br /><span className="text-[#a6a9ff]">Everyone in sync.</span></h1>
            <p className="mt-6 max-w-[480px] text-base leading-7 text-[#b6bacd] sm:text-lg sm:leading-8">Share your presentation with a link and guide everyone through it, one slide at a time.</p>
            <div className="mt-8 flex flex-wrap items-center gap-4"><a href="#upload" className="inline-flex h-12 items-center gap-3 rounded-xl bg-indigo-500 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-950/30 transition-colors hover:bg-indigo-400">Start presenting <ArrowRight className="size-4" /></a><a href="#how-it-works" className="inline-flex h-12 items-center gap-2 px-1 text-sm font-medium text-[#c9ccda] transition-colors hover:text-white">See how it works <ArrowDown className="size-4" /></a></div>
            <p className="mt-6 flex items-center gap-2 text-xs text-[#8f96ad]"><Check className="size-3.5 text-indigo-300" /> PowerPoint in. A shareable presentation out.</p>
          </div>
          <PresentationIllustration />
        </section>
      </div>

      <section id="how-it-works" className="mx-auto max-w-[1280px] px-5 py-20 sm:px-8 sm:py-24 lg:px-10">
        <div className="grid gap-5 md:grid-cols-[1fr_1fr] md:items-end"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-indigo-600">Simple by design</p><h2 className="mt-3 max-w-md text-3xl font-semibold leading-tight tracking-[-0.035em] text-[#202436] sm:text-4xl">From your screen to theirs.</h2></div><p className="max-w-md text-sm leading-7 text-[#7c8293] md:ml-auto">Keep everyone on the same page, whether you’re walking through an idea, a lesson, or your next project.</p></div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">{steps.map(({ number, icon: Icon, title, description }) => <article key={number} className="rounded-2xl border border-[#eceef4] bg-[#fafbfe] p-6 sm:p-7"><div className="flex items-center justify-between"><span className="flex size-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Icon className="size-5" /></span><span className="font-mono text-xs font-semibold text-[#c3c7d2]">{number}</span></div><h3 className="mt-7 text-lg font-semibold tracking-tight">{title}</h3><p className="mt-2 max-w-xs text-sm leading-6 text-[#818797]">{description}</p></article>)}</div>
      </section>

      <section id="upload" className="scroll-mt-6 border-y border-[#eaecf3] bg-[#f7f8fc]">
        <div className="mx-auto grid max-w-[1280px] items-start gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[1fr_1fr] lg:gap-20 lg:px-10 lg:py-24">
          <div className="max-w-[480px]"><p className="text-xs font-bold uppercase tracking-[.16em] text-indigo-600">Get started</p><h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.035em] sm:text-4xl">Your next presentation starts here.</h2><p className="mt-4 text-sm leading-7 text-[#7d8494] sm:text-base">Choose a PowerPoint file, set your session duration, and create your presenter workspace.</p><div className="mt-8 space-y-4 border-t border-[#e7e9f1] pt-7"><p className="flex items-start gap-3 text-sm text-[#606879]"><Link2 className="mt-0.5 size-4 shrink-0 text-indigo-500" /> A separate link for your audience to join</p><p className="flex items-start gap-3 text-sm text-[#606879]"><Download className="mt-0.5 size-4 shrink-0 text-indigo-500" /> Viewers can download your original presentation</p><p className="flex items-start gap-3 text-sm text-[#606879]"><Clock3 className="mt-0.5 size-4 shrink-0 text-indigo-500" /> Choose when live updates stop</p></div></div>
          <UploadForm />
        </div>
      </section>
      <footer className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3 px-5 py-7 text-xs text-[#969cac] sm:px-8 lg:px-10"><span className="flex items-center gap-2 font-semibold text-[#626a7b]"><Presentation className="size-4 text-indigo-500" /> Presentation Share</span><span>Made with <span aria-label="love" className="text-indigo-500">♥</span> <a href="https://www.ebinesh.in/?utm_source=presentation_share&amp;utm_medium=referral&amp;utm_campaign=footer" className="font-semibold text-[#626a7b] underline-offset-4 hover:text-indigo-600 hover:underline">Ebinesh</a></span></footer>
    </main>
  )
}
