import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  CheckCircle,
  X,
  RotateCcw,
  MessageCircle,
  TrendingUp,
  Heart,
  Bell,
  Brain,
  Smartphone,
  Users,
  Zap,
  Target,
  ArrowRight,
} from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20">
      {/* Hero Section */}
      <section className="px-4 py-16 md:py-24 max-w-6xl mx-auto text-center">
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-slate-800 leading-tight">
              Rewire Your Habits.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600">
                Reclaim Your Mind.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed">
              MindMend is your AI-powered coach that helps you break bad habits and build good ones. One check-in at a
              time.
            </p>
          </div>

          <div className="pt-4">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white px-8 py-6 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <ArrowRight className="mr-2 h-5 w-5" />
              Get Early Access
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="px-4 py-16 max-w-4xl mx-auto">
        <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50 shadow-lg">
          <CardContent className="p-8 md:p-12 text-center space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800">You know what to do.</h2>
            <div className="space-y-4 text-lg text-slate-600">
              <p>But then you open TikTok. Skip the gym. Fall back into old loops. Again.</p>
              <p className="font-semibold text-slate-700">Willpower alone isn't enough.</p>
              <p>
                You need a system that understands your patterns, reminds you when it matters, and helps you rebuild
                consistency — without judgment.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* How MindMend Helps */}
      <section className="px-4 py-16 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">How MindMend Helps</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="bg-red-50/50 border-red-200/50 hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <X className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800">Break bad habits.</h3>
              <p className="text-slate-600">🛑 Doomscrolling, porn, late-night snacking</p>
            </CardContent>
          </Card>

          <Card className="bg-emerald-50/50 border-emerald-200/50 hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800">Build good ones.</h3>
              <p className="text-slate-600">✅ Deep work, early wake-ups, gym consistency</p>
            </CardContent>
          </Card>

          <Card className="bg-blue-50/50 border-blue-200/50 hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Brain className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800">Stay on track, with AI.</h3>
              <p className="text-slate-600">Get personalized insights and support when you need it most</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Core Features */}
      <section className="px-4 py-16 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">Core Features</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50 hover:shadow-lg transition-shadow">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center space-x-3">
                <RotateCcw className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-slate-800">Clean & Habit Streaks</h3>
              </div>
              <p className="text-slate-600">Track both the good and the bad — in one dashboard.</p>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50 hover:shadow-lg transition-shadow">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center space-x-3">
                <MessageCircle className="h-6 w-6 text-emerald-600" />
                <h3 className="text-lg font-semibold text-slate-800">AI Daily Check-ins</h3>
              </div>
              <p className="text-slate-600">
                Reflect each morning and night with thoughtful prompts and personalized feedback.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50 hover:shadow-lg transition-shadow">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-6 w-6 text-purple-600" />
                <h3 className="text-lg font-semibold text-slate-800">Trigger Pattern Detection</h3>
              </div>
              <p className="text-slate-600">Log relapses and skipped habits — MindMend shows you your blind spots.</p>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50 hover:shadow-lg transition-shadow">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center space-x-3">
                <Heart className="h-6 w-6 text-rose-600" />
                <h3 className="text-lg font-semibold text-slate-800">Custom Coach Vibes</h3>
              </div>
              <p className="text-slate-600">Choose between Calm Monk, Drill Sergeant, or Chill Friend mode.</p>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50 hover:shadow-lg transition-shadow">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center space-x-3">
                <Bell className="h-6 w-6 text-orange-600" />
                <h3 className="text-lg font-semibold text-slate-800">Smart Push Nudges</h3>
              </div>
              <p className="text-slate-600">Get reminded when you're most likely to relapse — not just randomly.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Who It's For */}
      <section className="px-4 py-16 max-w-4xl mx-auto">
        <Card className="bg-gradient-to-br from-blue-50/50 to-emerald-50/50 border-slate-200/50">
          <CardContent className="p-8 md:p-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">Who It's For</h2>
              <p className="text-lg text-slate-600">MindMend is for anyone who wants to:</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <span className="text-slate-700">Quit porn or compulsive scrolling</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <span className="text-slate-700">Stay consistent with deep work and gym routines</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <span className="text-slate-700">Build self-discipline through daily feedback</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <span className="text-slate-700">Replace shame and guilt with clarity and confidence</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Join Beta */}
      <section className="px-4 py-16 max-w-4xl mx-auto">
        <Card className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white">
          <CardContent className="p-8 md:p-12 text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">Join the Private Beta</h2>
            <p className="text-lg text-blue-100">We're launching soon on iOS and Android.</p>

            <div className="space-y-4">
              <p className="text-blue-100">Join the early access waitlist for:</p>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center justify-center space-x-2">
                  <Zap className="h-4 w-4" />
                  <span>Free early access</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <Target className="h-4 w-4" />
                  <span>Beta-only features</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Help shape the app</span>
                </div>
              </div>
            </div>

            <Button
              size="lg"
              variant="secondary"
              className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg font-semibold rounded-full"
            >
              Get Early Access
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Screenshot Preview */}
      <section className="px-4 py-16 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">See MindMend in Action</h2>
        </div>

        <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50">
          <CardContent className="p-8">
            <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg p-8 text-center">
              <Smartphone className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <div className="space-y-2">
                <p className="text-lg font-semibold text-slate-700">Day 7 clean, 3 habits hit today</p>
                <p className="text-slate-500">Screenshot preview coming soon</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* FAQ */}
      <section className="px-4 py-16 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-6">
          <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Is this just another habit tracker?</h3>
              <p className="text-slate-600">
                No — MindMend doesn't just log habits. It understands your patterns and gives real-time AI feedback so
                you can improve over time.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">What kinds of habits can I track?</h3>
              <p className="text-slate-600">
                You can track both good habits (workouts, sleep, deep work) and bad ones (porn, TikTok, junk food).
                You're in full control.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Does it cost money?</h3>
              <p className="text-slate-600">
                MindMend will be free to try during beta. Paid plans will unlock premium features like coach
                customization and deep insights.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Will this be on iOS and Android?</h3>
              <p className="text-slate-600">Yes! We're launching on both — join the waitlist to be notified first.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-16 max-w-4xl mx-auto">
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 text-white">
          <CardContent className="p-8 md:p-12 text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">Break the loop. Build what matters.</h2>
            <p className="text-lg text-slate-300">
              Join the waitlist and be part of the early crew building discipline — with the help of AI.
            </p>

            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white px-8 py-6 text-lg font-semibold rounded-full"
            >
              <ArrowRight className="mr-2 h-5 w-5" />
              Get Early Access
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 max-w-6xl mx-auto text-center border-t border-slate-200/50">
        <div className="space-y-2">
          <p className="text-slate-600">
            MindMend © 2025 | Built for dopamine detoxers, discipline seekers, and self-improvers.
          </p>
          <p className="text-slate-500">
            Questions? Reach us at{" "}
            <a href="mailto:hello@mindmend.app" className="text-blue-600 hover:text-blue-700">
              hello@mindmend.app
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
