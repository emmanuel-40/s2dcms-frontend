// Landing Page with Image Carousel and Role Switcher
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Building2, ArrowRight, ChevronLeft, ChevronRight, Mail, Send, CheckCircle } from 'lucide-react';
import { logError, parseErrorBody } from '../utils/errors';

const LandingPage = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [authMode, setAuthMode] = useState('student'); // 'student' or 'department'
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactError, setContactError] = useState('');
  const navigate = useNavigate();

  // Image carousel slides - user should place images at: frontend/public/images/
  const slides = [
    {
      id: 1,
      image: '/images/campus1.png',
      title: 'Connect with Departments',
      description: 'Easily submit complaints and get responses from your department'
    },
    {
      id: 2,
      image: '/images/campus2.png',
      title: 'Track Your Progress',
      description: 'Monitor the status of your complaints in real-time'
    },
    {
      id: 3,
      image: '/images/campus3.jpg',
      title: 'Quick Resolution',
      description: 'Get timely responses and solutions to your concerns'
    }
  ];

  // Auto-rotate slides every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleJoinNow = () => {
    setShowAuthModal(true);
  };

  const handleAuthAction = (action) => {
    if (authMode === 'student') {
      if (action === 'register') {
        navigate('/register');
      } else {
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
    setShowAuthModal(false);
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactError('');
    
    try {
      const response = await fetch('http://localhost:8080/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactForm),
      });

      if (response.ok) {
        setContactSubmitted(true);
        setContactForm({ name: '', email: '', message: '' });
        setTimeout(() => {
          setContactSubmitted(false);
          setShowContactModal(false);
        }, 3000);
      } else {
        const { message } = await parseErrorBody(response);
        logError(`Contact form rejected with status ${response.status}`, message);
        setContactError(message || 'Failed to send message. Please try again.');
      }
    } catch (error) {
      logError('Contact form submission failed', error);
      setContactError('Network error. Please check your connection.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-800">S2DCMS</h1>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowContactModal(true)}
                className="px-4 py-2 text-gray-600 hover:text-blue-600 font-medium flex items-center space-x-1"
              >
                <Mail className="h-4 w-4" />
                <span>Contact</span>
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
              >
                Login
              </button>
              <button
                onClick={handleJoinNow}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Join Now
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Carousel */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <h2 className="text-5xl font-bold text-gray-900 leading-tight">
              Student to Department
              <span className="text-blue-600 block">Complaint Management</span>
            </h2>
            <p className="text-xl text-gray-600">
              Streamline communication between students and departments. Submit complaints, track progress, and get timely responses.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={handleJoinNow}
                className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105 font-semibold flex items-center space-x-2 shadow-lg"
              >
                <span>Get Started</span>
                <ArrowRight className="h-5 w-5" />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-8 py-4 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition-all font-semibold"
              >
                Learn More
              </button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-6 pt-8">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">For Students</h3>
                  <p className="text-sm text-gray-600">Submit & track complaints easily</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Building2 className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">For Departments</h3>
                  <p className="text-sm text-gray-600">Manage & respond efficiently</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Image Carousel */}
          <div className="relative">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="relative h-96 overflow-hidden">
                <div 
                  className="flex transition-transform duration-500 ease-in-out h-full"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {slides.map((slide, index) => (
                    <div
                      key={slide.id}
                      className="w-full h-full flex-shrink-0 relative bg-gray-100"
                    >
                      <img
                        src={slide.image}
                        alt={slide.title}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml,' + encodeURIComponent(`
                            <svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400">
                              <rect width="800" height="400" fill="#e5e7eb"/>
                              <text x="400" y="200" text-anchor="middle" fill="#6b7280" font-size="20">Image: ${slide.image}</text>
                            </svg>
                          `);
                        }}
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-6">
                        <h3 className="text-white text-2xl font-bold drop-shadow-lg">{slide.title}</h3>
                        <p className="text-white text-base drop-shadow-md">{slide.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Navigation Arrows */}
                <button
                  onClick={prevSlide}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg transition-colors"
                >
                  <ChevronLeft className="h-6 w-6 text-gray-800" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg transition-colors"
                >
                  <ChevronRight className="h-6 w-6 text-gray-800" />
                </button>

                {/* Dots */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                  {slides.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        index === currentSlide ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Choose Your Role</h2>
            
            {/* Role Switcher */}
            <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
              <button
                onClick={() => setAuthMode('student')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  authMode === 'student'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <GraduationCap className="h-5 w-5" />
                  <span>Student</span>
                </div>
              </button>
              <button
                onClick={() => setAuthMode('department')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  authMode === 'department'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Building2 className="h-5 w-5" />
                  <span>Department</span>
                </div>
              </button>
            </div>

            {/* Auth Options based on role */}
            <div className="space-y-4">
              {authMode === 'student' ? (
                <>
                  <button
                    onClick={() => handleAuthAction('register')}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    Register as Student
                  </button>
                  <button
                    onClick={() => handleAuthAction('login')}
                    className="w-full py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold"
                  >
                    Login as Student
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleAuthAction('login')}
                  className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
                >
                  Login as Department
                </button>
              )}
            </div>

            <button
              onClick={() => setShowAuthModal(false)}
              className="mt-6 w-full py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Contact Us</h2>
              <button
                onClick={() => setShowContactModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {contactSubmitted ? (
              <div className="text-center py-8">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Message Sent!</h3>
                <p className="text-gray-600">Thank you for contacting us. We'll get back to you soon.</p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="your.email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    required
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                    placeholder="How can we help you?"
                  />
                </div>
                {contactError && (
                  <p className="text-red-600 text-sm">{contactError}</p>
                )}
                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center space-x-2"
                >
                  <Send className="h-5 w-5" />
                  <span>Send Message</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-600">
            © {new Date().getFullYear()} S2DCMS - Student to Department Complaint Management System
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
