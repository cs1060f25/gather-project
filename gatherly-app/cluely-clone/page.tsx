import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Apple Icon Component
const AppleIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
  </svg>
);

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-[#5b7fa8]/95 to-[#5b7fa8]/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white rounded-full" />
              <span className="text-white font-semibold text-lg">Cluely</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#" className="text-white/90 hover:text-white text-sm">Pricing</a>
              <a href="#" className="text-white/90 hover:text-white text-sm">Enterprise</a>
              <a href="#" className="text-white/90 hover:text-white text-sm">Careers</a>
              <a href="#" className="text-white/90 hover:text-white text-sm">Blog</a>
            </div>
          </div>
          <Button className="bg-[#4a8fff] hover:bg-[#3d7de6] text-white">
            <AppleIcon />
            Get for Mac
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[100vh] bg-gradient-to-br from-[#5b7fa8] via-[#6b8fb8] to-[#7ba3c8] pt-32 pb-20 overflow-hidden">
        <div className="container mx-auto px-6 text-center relative z-10">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif text-white mb-6 leading-tight">
            #1 AI assistant
            <br />
            for meetings
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Takes perfect notes, answers questions in real-time, and
            <br />
            makes you the most prepared person on every call.
          </p>
          <Button className="bg-[#4a8fff] hover:bg-[#3d7de6] text-white px-8 py-6 text-lg rounded-lg">
            Get for Mac
          </Button>

          {/* Product Demo Mockup */}
          <div className="mt-16 relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl max-w-5xl mx-auto">
              <div className="aspect-[16/10] bg-gradient-to-br from-[#4a9fff] via-[#ffa366] to-[#d694a8] p-8">
                <div className="w-full h-full bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <div className="bg-gray-900 rounded-lg p-6 w-[90%] max-w-2xl">
                    <div className="flex gap-2 mb-4">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-end">
                        <div className="bg-[#4a8fff] text-white px-4 py-2 rounded-2xl max-w-xs">
                          What should I say?
                        </div>
                      </div>
                      <div className="text-gray-400 text-sm">Searched records</div>
                      <div className="bg-gray-800 text-white p-4 rounded-lg">
                        "So just to recap—you need new cabinets and lighting. I'll send you a quote within the hour."
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" className="text-white border-gray-700">
                          What should I say?
                        </Button>
                        <Button variant="outline" className="text-white border-gray-700">
                          Follow-up questions
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Four Ways Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold mb-16">
            Four ways we make your
            <br />
            meetings better
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Feature 1 */}
            <Card className="p-8 bg-gradient-to-br from-[#4a8fff] to-[#6ba3ff] text-white border-0 rounded-3xl">
              <div className="mb-32">
                <h3 className="text-2xl font-bold mb-4">
                  AI that answers questions for you,
                  <br />
                  real-time
                </h3>
                <p className="text-white/90">
                  Cluely uses the screen, transcript, and AI to answer
                  <br />
                  questions for you, live.
                </p>
              </div>
            </Card>

            {/* Feature 2 */}
            <Card className="p-8 bg-gray-100 border-0 rounded-3xl">
              <h3 className="text-2xl font-bold mb-4">Instant follow-up emails</h3>
              <p className="text-gray-600">
                Send perfectly drafted follow-up emails within seconds after every call.
              </p>
            </Card>

            {/* Feature 3 */}
            <Card className="p-8 bg-gray-100 border-0 rounded-3xl">
              <h3 className="text-2xl font-bold mb-4">
                Who are you
                <br />
                really talking to?
              </h3>
              <p className="text-gray-600">
                Learn everything about anyone before every call — where they work, what they do, and more.
              </p>
            </Card>

            {/* Feature 4 */}
            <Card className="p-8 bg-gray-100 border-0 rounded-3xl">
              <h3 className="text-2xl font-bold mb-4">Beautiful meeting notes</h3>
              <p className="text-gray-600">
                Instant shareable meeting notes generated by AI.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* 3 Steps Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Meeting notes in 3 steps
          </h2>
          <p className="text-xl text-gray-600 mb-16">
            The easiest way to get beautiful, shareable
            <br />
            meeting notes.
          </p>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-left">
              <div className="mb-6 aspect-[4/3] bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl" />
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl font-bold text-gray-300">1</span>
                <h3 className="text-2xl font-bold">Start Cluely</h3>
              </div>
              <p className="text-gray-600">
                Simply click Start Cluely before your
                <br />
                meeting begins.
              </p>
            </div>

            <div className="text-left">
              <div className="mb-6 aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl" />
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl font-bold text-gray-300">2</span>
                <h3 className="text-2xl font-bold">End Cluely</h3>
              </div>
              <p className="text-gray-600">
                Click the Stop button to end
                <br />
                recording. That's it.
              </p>
            </div>

            <div className="text-left">
              <div className="mb-6 aspect-[4/3] bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl" />
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl font-bold text-gray-300">3</span>
                <h3 className="text-2xl font-bold">Get notes</h3>
              </div>
              <p className="text-gray-600">
                Cluely uses what it heard and what it
                <br />
                saw on your screen to generate notes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              No meeting bots.
              <br />
              100% undetectable.
            </h2>
            <a href="#" className="text-[#4a8fff] hover:underline">
              How does Cluely stay undetectable?
            </a>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card className="p-8 bg-gray-100 border-0 rounded-3xl">
              <h3 className="text-2xl font-bold mb-4">Other AI Notetakers</h3>
              <div className="flex items-center gap-2 text-gray-600 mb-6">
                <span className="text-red-500">✕</span>
                <span>Joins as an invasive participant</span>
              </div>
              <div className="aspect-video bg-white rounded-lg" />
            </Card>

            <Card className="p-8 bg-gradient-to-br from-gray-700 to-gray-800 text-white border-0 rounded-3xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-white rounded-full" />
                <h3 className="text-2xl font-bold">Cluely</h3>
              </div>
              <div className="flex items-center gap-2 mb-6">
                <span className="text-green-500">✓</span>
                <span>Undetectable to screen share, visible to you</span>
              </div>
              <div className="aspect-video bg-gray-900 rounded-lg" />
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold mb-16 text-center">
            Real-time transcription
          </h2>

          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="text-6xl font-bold mb-4">12+</div>
              <h3 className="text-2xl font-bold mb-4">Languages</h3>
              <p className="text-gray-600">
                We support over 12 different languages, including English, Chinese, Spanish, and more.
              </p>
            </div>

            <div className="text-center">
              <div className="text-6xl font-bold mb-4">300ms</div>
              <h3 className="text-2xl font-bold mb-4">Response time</h3>
              <p className="text-gray-600">
                We have the fastest live transcription available. Test us against any other competitor.
              </p>
            </div>

            <div className="text-center">
              <div className="text-6xl font-bold mb-4">95%</div>
              <h3 className="text-2xl font-bold mb-4">Transcription accuracy</h3>
              <p className="text-gray-600">
                Trusted by many teams for reliable transcription. All processed with industry-leading accuracy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 max-w-4xl">
          <h2 className="text-4xl md:text-5xl font-bold mb-12">
            Frequently asked questions
          </h2>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1" className="border-b border-gray-200 py-4">
              <AccordionTrigger className="text-xl font-normal hover:no-underline">
                Why real-time vs. a regular AI notetaker?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                Real-time AI assistance helps you during the call, not after. You can get instant answers and suggestions while the conversation is happening.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border-b border-gray-200 py-4">
              <AccordionTrigger className="text-xl font-normal hover:no-underline">
                Who is Cluely for?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                Cluely is designed for professionals who want to be more effective in meetings, including sales teams, consultants, recruiters, and support teams.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border-b border-gray-200 py-4">
              <AccordionTrigger className="text-xl font-normal hover:no-underline">
                Is Cluely free?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                Cluely offers various pricing plans to suit different needs. Visit our pricing page for more details.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border-b border-gray-200 py-4">
              <AccordionTrigger className="text-xl font-normal hover:no-underline">
                How is it undetectable in meetings?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                Cluely works locally on your machine and doesn't join meetings as a bot participant, making it invisible to other participants.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="border-b border-gray-200 py-4">
              <AccordionTrigger className="text-xl font-normal hover:no-underline">
                What languages and apps are supported?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                Cluely supports 12+ languages and works with popular meeting platforms like Zoom, Google Meet, Microsoft Teams, and more.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="border-b border-gray-200 py-4">
              <AccordionTrigger className="text-xl font-normal hover:no-underline">
                Can I talk to customer support?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                Yes! Our support team is available to help. Contact us at help@cluely.com.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Meeting AI that helps during the call, not after.
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Try Cluely on your next meeting today.
          </p>
          <Button className="bg-[#4a8fff] hover:bg-[#3d7de6] text-white px-8 py-6 text-lg rounded-lg">
            Get for Mac
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-6 h-6 bg-gray-900 rounded-full" />
                <span className="font-semibold text-lg">Cluely</span>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Use Cases</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-gray-900">Sales</a></li>
                <li><a href="#" className="hover:text-gray-900">Support</a></li>
                <li><a href="#" className="hover:text-gray-900">Consulting</a></li>
                <li><a href="#" className="hover:text-gray-900">Recruiting</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Enterprise</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-gray-900">Cluely for Enterprise</a></li>
                <li><a href="#" className="hover:text-gray-900">Enterprise Guides</a></li>
                <li><a href="#" className="hover:text-gray-900">Security</a></li>
                <li><a href="#" className="hover:text-gray-900">ROI Calculator</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-gray-900">Manifesto</a></li>
                <li><a href="#" className="hover:text-gray-900">Press</a></li>
                <li><a href="#" className="hover:text-gray-900">Careers</a></li>
                <li><a href="#" className="hover:text-gray-900">Bug Bounty</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-gray-900">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-gray-900">Terms of Service</a></li>
                <li><a href="#" className="hover:text-gray-900">Data Processing Agreement</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-200 text-sm text-gray-600 text-center">
            © 2025 Cluely. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
