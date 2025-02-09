import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import { Music, Camera, Loader2, Play, Youtube, AlignJustify as Spotify } from 'lucide-react';

type Emotion = 'happy' | 'sad' | 'angry' | 'neutral' | 'surprised';

interface Song {
  title: string;
  videoId: string;
  spotifyId: string;
  language: 'english' | 'hindi';
}

const musicRecommendations: Record<Emotion, Song[]> = {
  happy: [
    { 
      title: 'Happy - Pharrell Williams', 
      videoId: 'ZbZSe6N_BXs',
      spotifyId: '60nZcImufyMA1MKQY3dcCH',
      language: 'english'
    },
    { 
      title: 'I Gotta Feeling - The Black Eyed Peas', 
      videoId: 'uSD4vsh1zDA',
      spotifyId: '4vp2J1l5RD0FQAb5CtkY1c',
      language: 'english'
    },
    { 
      title: 'Badtameez Dil - Yeh Jawaani Hai Deewani', 
      videoId: '9mWdw-09dso',
      spotifyId: '0bqC0AenGl5JlQn0mhQKhK',
      language: 'hindi'
    },
    { 
      title: 'London Thumakda - Queen', 
      videoId: 'udra3Mfw2oo',
      spotifyId: '0QUtFxdQy0GJCzSXLUeOL7',
      language: 'hindi'
    }
  ],
  sad: [
    { 
      title: 'Someone Like You - Adele', 
      videoId: 'hLQl3WQQoQ0',
      spotifyId: '1HNE2PX70ztbEl6MLxrpNL',
      language: 'english'
    },
    { 
      title: 'Channa Mereya - Ae Dil Hai Mushkil', 
      videoId: '284Ov7ysmfA',
      spotifyId: '2ZUkqvdT4kCPwpm8amF3ZE',
      language: 'hindi'
    },
    { 
      title: 'Tum Hi Ho - Aashiqui 2', 
      videoId: 'IJq0yyWug1k',
      spotifyId: '1DTMaEqXqnJgR7loF8lF1D',
      language: 'hindi'
    },
    { 
      title: 'Agar Tum Saath Ho - Tamasha', 
      videoId: 'sK7riqg2mr4',
      spotifyId: '4cEfZGJPJHyFtBm91bQZfU',
      language: 'hindi'
    }
  ],
  angry: [
    { 
      title: 'Break Stuff - Limp Bizkit', 
      videoId: 'ZpUYjpKg9KY',
      spotifyId: '5cZqsjVs6MevCnAkasbEOX',
      language: 'english'
    },
    { 
      title: 'Chikni Chameli - Agneepath', 
      videoId: 'MQM7CNoAsBI',
      spotifyId: '4z0H9aGEYpTFmKGYrY3HoR',
      language: 'hindi'
    },
    { 
      title: 'Malhari - Bajirao Mastani', 
      videoId: 'l_MyUGq7pgs',
      spotifyId: '0VHFqAKzDMDGrqjkAHbN9O',
      language: 'hindi'
    }
  ],
  neutral: [
    { 
      title: 'Perfect - Ed Sheeran', 
      videoId: '2Vv-BfVoq4g',
      spotifyId: '0tgVpDi06FyKpA1z0VMD4v',
      language: 'english'
    },
    { 
      title: 'Tum Se Hi - Jab We Met', 
      videoId: 'mt9xg0mmt28',
      spotifyId: '1DTMaEqXqnJgR7loF8lF1D',
      language: 'hindi'
    },
    { 
      title: 'Kal Ho Naa Ho - Title Track', 
      videoId: 'g0eO74UmRBs',
      spotifyId: '5nNmj1cLH3r4aA4XDJ2bgY',
      language: 'hindi'
    }
  ],
  surprised: [
    { 
      title: 'Wow - Post Malone', 
      videoId: '393C3pr2ioY',
      spotifyId: '7xQAfvXzm3AkraOtGPWIZg',
      language: 'english'
    },
    { 
      title: 'Kar Gayi Chull - Kapoor & Sons', 
      videoId: 'NTHz9ephYTw',
      spotifyId: '5WmvFE8EE9SeYPUx7K3qnY',
      language: 'hindi'
    },
    { 
      title: 'Desi Girl - Dostana', 
      videoId: 'RlEgUkrJx1s',
      spotifyId: '4OUaRVM4JFPBgqTWgtH3Qo',
      language: 'hindi'
    }
  ]
};

function App() {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [currentEmotion, setCurrentEmotion] = useState<Emotion | null>(null);
  const [recommendations, setRecommendations] = useState<Song[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<'all' | 'english' | 'hindi'>('all');

  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models'),
          faceapi.nets.faceExpressionNet.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models')
        ]);
        setIsModelLoading(false);
      } catch (error) {
        console.error('Error loading models:', error);
      }
    };

    loadModels();
  }, []);

  const handleVideoStream = async () => {
    if (webcamRef.current && webcamRef.current.video && canvasRef.current) {
      const video = webcamRef.current.video;
      const canvas = canvasRef.current;

      const detections = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();

      if (detections) {
        const expressions = detections.expressions;
        let dominantEmotion: Emotion = 'neutral';
        let maxValue = 0;

        Object.entries(expressions).forEach(([emotion, value]) => {
          if (value > maxValue) {
            maxValue = value;
            dominantEmotion = emotion as Emotion;
          }
        });

        setCurrentEmotion(dominantEmotion);
        setRecommendations(musicRecommendations[dominantEmotion] || []);

        const dims = faceapi.matchDimensions(canvas, video, true);
        const resizedDetections = faceapi.resizeResults(detections, dims);
        canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, resizedDetections);
      }
    }
  };

  useEffect(() => {
    if (!isModelLoading) {
      const interval = setInterval(handleVideoStream, 1000);
      return () => clearInterval(interval);
    }
  }, [isModelLoading]);

  const openYouTube = (videoId: string) => {
    window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
  };

  const openSpotify = (spotifyId: string) => {
    window.open(`https://open.spotify.com/track/${spotifyId}`, '_blank');
  };

  const filteredRecommendations = recommendations.filter(song => 
    selectedLanguage === 'all' || song.language === selectedLanguage
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-2">
            <Music className="w-8 h-8" />
            Emotion Music Recommender
          </h1>
          <p className="text-lg text-purple-200">
            Let us recommend and play music based on your mood!
          </p>
        </header>

        <div className="max-w-4xl mx-auto">
          <div className="relative bg-black/20 rounded-lg p-4 mb-8">
            {isModelLoading ? (
              <div className="flex items-center justify-center h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="ml-2">Loading face detection models...</span>
              </div>
            ) : (
              <div className="relative">
                <Webcam
                  ref={webcamRef}
                  className="w-full rounded-lg"
                  mirrored
                  videoConstraints={{
                    width: 640,
                    height: 480,
                    facingMode: "user",
                  }}
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full"
                />
                <div className="absolute top-4 left-4 bg-black/50 px-3 py-1 rounded-full flex items-center">
                  <Camera className="w-4 h-4 mr-2" />
                  <span className="text-sm">Camera Active</span>
                </div>
              </div>
            )}
          </div>

          {currentEmotion && (
            <div className="space-y-6">
              <div className="bg-white/10 rounded-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold">
                    Based on your {currentEmotion} mood, we recommend:
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedLanguage('all')}
                      className={`px-4 py-2 rounded-full transition-colors ${
                        selectedLanguage === 'all'
                          ? 'bg-purple-500 text-white'
                          : 'bg-white/10 hover:bg-white/20'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setSelectedLanguage('english')}
                      className={`px-4 py-2 rounded-full transition-colors ${
                        selectedLanguage === 'english'
                          ? 'bg-purple-500 text-white'
                          : 'bg-white/10 hover:bg-white/20'
                      }`}
                    >
                      English
                    </button>
                    <button
                      onClick={() => setSelectedLanguage('hindi')}
                      className={`px-4 py-2 rounded-full transition-colors ${
                        selectedLanguage === 'hindi'
                          ? 'bg-purple-500 text-white'
                          : 'bg-white/10 hover:bg-white/20'
                      }`}
                    >
                      Hindi
                    </button>
                  </div>
                </div>
                <ul className="space-y-3">
                  {filteredRecommendations.map((song, index) => (
                    <li
                      key={index}
                      className="bg-white/5 p-4 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Music className="w-5 h-5 mr-3 text-purple-300" />
                          <span>{song.title}</span>
                          <span className="ml-2 text-xs px-2 py-1 bg-white/10 rounded-full">
                            {song.language}
                          </span>
                        </div>
                        <div className="flex gap-4">
                          <button
                            onClick={() => openYouTube(song.videoId)}
                            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-3 py-1 rounded-full transition-colors"
                          >
                            <Youtube className="w-4 h-4" />
                            <span className="text-sm">YouTube</span>
                          </button>
                          <button
                            onClick={() => openSpotify(song.spotifyId)}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-3 py-1 rounded-full transition-colors"
                          >
                            <Spotify className="w-4 h-4" />
                            <span className="text-sm">Spotify</span>
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;