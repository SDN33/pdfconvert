import { useState, useEffect, lazy, Suspense } from 'react';
import jsPDF from 'jspdf';
import { checkConversionAllowed, logConversion, getClientIP } from './lib/supabase';
import { verifySession, logout as authLogout } from './lib/auth';
import { redirectToCheckout } from './lib/stripe';
import { shouldShowCookieBanner, acceptCookies } from './lib/cookies';
import CookieBanner from './components/CookieBanner';
import PremiumBanner from './components/PremiumBanner';
import { Analytics } from "@vercel/analytics/react"

// Lazy loading des modals pour optimiser le bundle
const UpgradeModal = lazy(() => import('./components/UpgradeModal'));
const LoginModal = lazy(() => import('./components/LoginModal'));
const RegisterModal = lazy(() => import('./components/RegisterModal'));

interface PageSettings {
  fontSize: number;
  lineHeight: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  titleSize: number;
  subtitleSize: number;
  addPageNumbers: boolean;
  addWatermark: boolean;
  themeColor: 'blue' | 'cyan' | 'purple' | 'green' | 'orange' | 'red' | 'pink' | 'yellow' | 'indigo' | 'teal';
  titleStyle: 'bold' | 'underline' | 'background';
  paragraphSpacing: number;
  addBorders: boolean;
  borderStyle: 'simple' | 'double' | 'rounded' | 'decorative' | 'gradient';
  headerText: string;
  footerText: string;
  pageNumberPosition: 'center' | 'left' | 'right';
}

// Icônes SVG personnalisées
const DownloadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SparkleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3l1.545 5.462L19 10l-5.455 1.538L12 17l-1.545-5.462L5 10l5.455-1.538L12 3z" fill="currentColor"/>
    <path d="M20 2l.636 2.364L23 5l-2.364.636L20 8l-.636-2.364L17 5l2.364-.636L20 2zM4 16l.636 2.364L7 19l-2.364.636L4 22l-.636-2.364L1 19l2.364-.636L4 16z" fill="currentColor" opacity="0.6"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 1v6m0 6v10M1 12h6m6 0h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M4.22 4.22l4.24 4.24m7.08 0l4.24-4.24M4.22 19.78l4.24-4.24m7.08 0l4.24 4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const FileIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-7-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13 2v7h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

function App() {
  const [markdown, setMarkdown] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCookieBanner, setShowCookieBanner] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);
  const [conversionsToday, setConversionsToday] = useState(0);
  const [userIP, setUserIP] = useState<string>('');
  const [isPremium, setIsPremium] = useState(false);
  const [premiumEmail, setPremiumEmail] = useState<string>('');
  
  const [settings, setSettings] = useState<PageSettings>({
    fontSize: 11,
    lineHeight: 1.6,
    marginTop: 20,
    marginBottom: 20,
    marginLeft: 20,
    marginRight: 20,
    titleSize: 20,
    subtitleSize: 14,
    addPageNumbers: true,
    addWatermark: false,
    themeColor: 'cyan',
    titleStyle: 'bold',
    paragraphSpacing: 5,
    addBorders: false,
    borderStyle: 'simple',
    headerText: '',
    footerText: '',
    pageNumberPosition: 'center',
  });

  // Vérifier les cookies au chargement
  useEffect(() => {
    setShowCookieBanner(shouldShowCookieBanner());
    
    // Vérifier si c'est un retour après setup-password
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('welcome') === 'true') {
      setShowWelcomeBanner(true);
      // Nettoyer l'URL
      window.history.replaceState({}, '', '/');
      // Masquer après 10 secondes
      setTimeout(() => setShowWelcomeBanner(false), 10000);
    }
    
    // Récupérer l'IP de l'utilisateur
    const fetchIPAndCheck = async () => {
      const ip = await getClientIP();
      setUserIP(ip);
      
      // Vérifier la session token
      const sessionToken = localStorage.getItem('session_token');
      let currentEmail = '';
      
      if (sessionToken) {
        const sessionCheck = await verifySession(sessionToken);
        if (sessionCheck.valid && sessionCheck.user) {
          setIsPremium(sessionCheck.user.isPremium);
          setPremiumEmail(sessionCheck.user.email);
          currentEmail = sessionCheck.user.email;
        } else {
          // Session invalide ou expirée
          localStorage.removeItem('session_token');
          setIsPremium(false);
          setPremiumEmail('');
        }
      }
      
      // Vérifier le nombre de conversions avec la nouvelle fonction
      const result = await checkConversionAllowed(ip, currentEmail || undefined);
      setConversionsToday(result.conversionsUsed);
    };
    
    fetchIPAndCheck();

    // Écouter l'événement personnalisé pour ouvrir le modal upgrade
    const handleShowUpgrade = () => setShowUpgradeModal(true);
    window.addEventListener('showUpgradeModal', handleShowUpgrade);
    
    return () => {
      window.removeEventListener('showUpgradeModal', handleShowUpgrade);
    };
  }, []);

  const handleAcceptCookies = () => {
    acceptCookies();
    setShowCookieBanner(false);
  };

  const handleUpgrade = async () => {
    try {
      await redirectToCheckout(premiumEmail || undefined);
    } catch (error) {
      console.error('Error upgrading:', error);
      alert('Erreur lors de la redirection vers le paiement. Veuillez réessayer.');
    }
  };

  const handleLoginSuccess = (_sessionToken: string, email: string) => {
    setIsPremium(true);
    setPremiumEmail(email);
    setConversionsToday(0);
  };

  const handleRegisterSuccess = (_sessionToken: string, email: string) => {
    setIsPremium(true);
    setPremiumEmail(email);
    setConversionsToday(0);
  };

  const handleLogout = async () => {
    const sessionToken = localStorage.getItem('session_token');
    if (sessionToken) {
      await authLogout(sessionToken);
    }
    localStorage.removeItem('session_token');
    setIsPremium(false);
    setPremiumEmail('');
  };

  const handleConvert = async () => {
    if (!markdown.trim()) return;

    // Si l'utilisateur est premium, pas de limite
    if (isPremium) {
      setIsConverting(true);
      await performConversion();
      return;
    }

    // Vérifier si l'utilisateur peut convertir avec la nouvelle fonction centralisée
    const result = await checkConversionAllowed(userIP, premiumEmail || undefined);
    setConversionsToday(result.conversionsUsed);
    
    if (!result.allowed) {
      alert(result.message || 'Limite de conversions atteinte.');
      setShowUpgradeModal(true);
      return;
    }

    setIsConverting(true);
    await performConversion();
  };

  const performConversion = async () => {

    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const contentWidth = pageWidth - settings.marginLeft - settings.marginRight;
      let y = settings.marginTop;

      // Parser le markdown ligne par ligne
      const lines = markdown.split('\n');
      let inCodeBlock = false;
      let codeContent: string[] = [];
      let listLevel = 0;
      let orderedListCounter: number[] = [];

      const addNewPageIfNeeded = (spaceNeeded: number) => {
        if (y + spaceNeeded > pageHeight - settings.marginBottom) {
          pdf.addPage();
          y = settings.marginTop;
          return true;
        }
        return false;
      };

      const wrapText = (text: string, maxWidth: number, fontSize: number) => {
        pdf.setFontSize(fontSize);
        return pdf.splitTextToSize(text, maxWidth);
      };

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Gérer les blocs de code
        if (line.startsWith('```')) {
          if (!inCodeBlock) {
            inCodeBlock = true;
            codeContent = [];
            continue;
          } else {
            inCodeBlock = false;
            // Afficher le bloc de code
            addNewPageIfNeeded(20 + codeContent.length * settings.fontSize * 0.5);
            pdf.setFillColor(245, 245, 245);
            const blockHeight = (codeContent.length + 1) * settings.fontSize * 0.5 + 8;
            pdf.rect(settings.marginLeft, y, contentWidth, blockHeight, 'F');
            
            pdf.setFont('courier', 'normal');
            pdf.setFontSize(9);
            pdf.setTextColor(60, 60, 60);
            
            y += 6;
            codeContent.forEach(codeLine => {
              pdf.text(codeLine, settings.marginLeft + 4, y);
              y += settings.fontSize * 0.5;
            });
            
            y += 8;
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(0, 0, 0);
            continue;
          }
        }

        if (inCodeBlock) {
          codeContent.push(line);
          continue;
        }

        // Lignes vides
        if (!line.trim()) {
          y += settings.paragraphSpacing;
          listLevel = 0;
          orderedListCounter = [];
          continue;
        }

        // Séparateurs horizontaux
        if (line.trim() === '---' || line.trim() === '***') {
          addNewPageIfNeeded(10);
          y += 5;
          pdf.setDrawColor(200, 200, 200);
          pdf.line(settings.marginLeft, y, pageWidth - settings.marginRight, y);
          y += 10;
          continue;
        }

        // Titres H1
        if (line.startsWith('# ')) {
          addNewPageIfNeeded(settings.titleSize * 2);
          
          const text = line.substring(2);
          const themeColors = {
            blue: [30, 64, 175],
            cyan: [8, 145, 178],
            purple: [139, 92, 246],
            green: [34, 197, 94],
            orange: [249, 115, 22],
            red: [220, 38, 38],
            pink: [236, 72, 153],
            yellow: [234, 179, 8],
            indigo: [99, 102, 241],
            teal: [20, 184, 166]
          };
          const color = themeColors[settings.themeColor];
          
          if (settings.titleStyle === 'background') {
            pdf.setFillColor(color[0], color[1], color[2]);
            pdf.rect(settings.marginLeft, y - settings.titleSize + 2, contentWidth, settings.titleSize + 4, 'F');
            pdf.setTextColor(255, 255, 255);
          } else {
            pdf.setTextColor(color[0], color[1], color[2]);
          }
          
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(settings.titleSize);
          pdf.text(text, settings.marginLeft + (settings.titleStyle === 'background' ? 5 : 0), y);
          
          if (settings.titleStyle === 'underline') {
            const textWidth = pdf.getTextWidth(text);
            pdf.setDrawColor(color[0], color[1], color[2]);
            pdf.setLineWidth(2);
            pdf.line(settings.marginLeft, y + 2, settings.marginLeft + textWidth, y + 2);
          }
          
          y += settings.titleSize * 1.5;
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(0, 0, 0);
          continue;
        }

        // Titres H2
        if (line.startsWith('## ')) {
          addNewPageIfNeeded(settings.subtitleSize * 2);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(settings.subtitleSize);
          pdf.setTextColor(30, 64, 175);
          const text = line.substring(3);
          pdf.text(text, settings.marginLeft, y);
          y += settings.subtitleSize * 1.5;
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(0, 0, 0);
          continue;
        }

        // Titres H3
        if (line.startsWith('### ')) {
          addNewPageIfNeeded(settings.fontSize * 1.5);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(settings.fontSize + 2);
          pdf.setTextColor(30, 64, 175);
          const text = line.substring(4);
          pdf.text(text, settings.marginLeft, y);
          y += (settings.fontSize + 2) * 1.3;
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(0, 0, 0);
          continue;
        }

        // Listes à puces
        if (line.match(/^(\s*)[-*+]\s/)) {
          const match = line.match(/^(\s*)[-*+]\s(.+)$/);
          if (match) {
            const indent = match[1].length;
            const text = match[2];
            listLevel = Math.floor(indent / 2);
            
            const bulletX = settings.marginLeft + (listLevel * 10);
            const textX = bulletX + 8;
            
            pdf.setFontSize(settings.fontSize);
            const wrappedLines = wrapText(text, contentWidth - (listLevel * 10) - 10, settings.fontSize);
            
            addNewPageIfNeeded(wrappedLines.length * settings.fontSize * settings.lineHeight);
            
            // Dessiner la puce
            pdf.circle(bulletX, y - 1.5, 1, 'F');
            
            wrappedLines.forEach((wrappedLine: string, idx: number) => {
              pdf.text(wrappedLine, idx === 0 ? textX : textX, y);
              if (idx < wrappedLines.length - 1) y += settings.fontSize * settings.lineHeight;
            });
            
            y += settings.fontSize * settings.lineHeight;
            continue;
          }
        }

        // Listes numérotées
        if (line.match(/^(\s*)\d+\.\s/)) {
          const match = line.match(/^(\s*)\d+\.\s(.+)$/);
          if (match) {
            const indent = match[1].length;
            const text = match[2];
            listLevel = Math.floor(indent / 2);
            
            if (orderedListCounter.length <= listLevel) {
              orderedListCounter[listLevel] = 1;
            } else {
              orderedListCounter[listLevel]++;
            }
            
            const numberX = settings.marginLeft + (listLevel * 10);
            const textX = numberX + 12;
            
            pdf.setFontSize(settings.fontSize);
            const wrappedLines = wrapText(text, contentWidth - (listLevel * 10) - 14, settings.fontSize);
            
            addNewPageIfNeeded(wrappedLines.length * settings.fontSize * settings.lineHeight);
            
            pdf.text(`${orderedListCounter[listLevel]}.`, numberX, y);
            
            wrappedLines.forEach((wrappedLine: string, idx: number) => {
              pdf.text(wrappedLine, textX, y);
              if (idx < wrappedLines.length - 1) y += settings.fontSize * settings.lineHeight;
            });
            
            y += settings.fontSize * settings.lineHeight;
            continue;
          }
        }

        // Paragraphes normaux avec gras, italique, code inline et liens
        listLevel = 0;
        orderedListCounter = [];
        
        const processedLine = line;
        const segments: Array<{ text: string; bold: boolean; italic: boolean; code: boolean }> = [];
        
        // Regex pour capturer gras, italique, code inline
        const regex = /(\*\*\*(.+?)\*\*\*)|(\*\*(.+?)\*\*)|(\*(.+?)\*)|(~~(.+?)~~)|(`(.+?)`)|\[([^\]]+)\]\(([^)]+)\)/g;
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(processedLine)) !== null) {
          // Texte avant le match
          if (match.index > lastIndex) {
            segments.push({
              text: processedLine.substring(lastIndex, match.index),
              bold: false,
              italic: false,
              code: false
            });
          }

          if (match[1]) {
            // ***gras+italique***
            segments.push({ text: match[2], bold: true, italic: true, code: false });
          } else if (match[3]) {
            // **gras**
            segments.push({ text: match[4], bold: true, italic: false, code: false });
          } else if (match[5]) {
            // *italique*
            segments.push({ text: match[6], bold: false, italic: true, code: false });
          } else if (match[7]) {
            // ~~barré~~
            segments.push({ text: match[8], bold: false, italic: false, code: false });
          } else if (match[9]) {
            // `code`
            segments.push({ text: match[10], bold: false, italic: false, code: true });
          } else if (match[11]) {
            // [texte](lien)
            segments.push({ text: match[11], bold: false, italic: false, code: false });
          }

          lastIndex = regex.lastIndex;
        }

        // Texte restant
        if (lastIndex < processedLine.length) {
          segments.push({
            text: processedLine.substring(lastIndex),
            bold: false,
            italic: false,
            code: false
          });
        }

        // Afficher les segments
        if (segments.length > 0) {
          pdf.setFontSize(settings.fontSize);
          let currentX = settings.marginLeft;
          let currentLine = '';
          let currentSegments: typeof segments = [];

          for (const segment of segments) {
            const words = segment.text.split(' ');
            
            for (let w = 0; w < words.length; w++) {
              const word = words[w] + (w < words.length - 1 ? ' ' : '');
              const testLine = currentLine + word;
              
              pdf.setFont('helvetica', segment.bold && segment.italic ? 'bolditalic' : segment.bold ? 'bold' : segment.italic ? 'italic' : 'normal');
              const testWidth = pdf.getTextWidth(testLine);
              
              if (testWidth > contentWidth && currentLine) {
                // Afficher la ligne actuelle
                addNewPageIfNeeded(settings.fontSize * settings.lineHeight);
                
                currentSegments.forEach(seg => {
                  pdf.setFont('helvetica', seg.bold && seg.italic ? 'bolditalic' : seg.bold ? 'bold' : seg.italic ? 'italic' : 'normal');
                  
                  if (seg.code) {
                    pdf.setFillColor(240, 240, 240);
                    const textWidth = pdf.getTextWidth(seg.text);
                    pdf.rect(currentX - 1, y - settings.fontSize + 1, textWidth + 2, settings.fontSize + 1, 'F');
                    pdf.setTextColor(220, 38, 38);
                  }
                  
                  pdf.text(seg.text, currentX, y);
                  currentX += pdf.getTextWidth(seg.text);
                  
                  if (seg.code) {
                    pdf.setTextColor(0, 0, 0);
                  }
                });
                
                y += settings.fontSize * settings.lineHeight;
                currentX = settings.marginLeft;
                currentLine = word;
                currentSegments = [{ ...segment, text: word }];
              } else {
                currentLine = testLine;
                if (currentSegments.length > 0 && 
                    currentSegments[currentSegments.length - 1].bold === segment.bold &&
                    currentSegments[currentSegments.length - 1].italic === segment.italic &&
                    currentSegments[currentSegments.length - 1].code === segment.code) {
                  currentSegments[currentSegments.length - 1].text += word;
                } else {
                  currentSegments.push({ ...segment, text: word });
                }
              }
            }
          }

          // Afficher la dernière ligne
          if (currentLine) {
            addNewPageIfNeeded(settings.fontSize * settings.lineHeight);
            
            currentSegments.forEach(seg => {
              pdf.setFont('helvetica', seg.bold && seg.italic ? 'bolditalic' : seg.bold ? 'bold' : seg.italic ? 'italic' : 'normal');
              
              if (seg.code) {
                pdf.setFillColor(240, 240, 240);
                const textWidth = pdf.getTextWidth(seg.text);
                pdf.rect(currentX - 1, y - settings.fontSize + 1, textWidth + 2, settings.fontSize + 1, 'F');
                pdf.setTextColor(220, 38, 38);
              }
              
              pdf.text(seg.text, currentX, y);
              currentX += pdf.getTextWidth(seg.text);
              
              if (seg.code) {
                pdf.setTextColor(0, 0, 0);
              }
            });
            
            y += settings.fontSize * settings.lineHeight;
          }
          
          pdf.setFont('helvetica', 'normal');
        }

        // Gérer les citations (blockquotes)
        if (line.startsWith('> ')) {
          const text = line.substring(2);
          addNewPageIfNeeded(settings.fontSize * settings.lineHeight * 2);
          
          pdf.setDrawColor(139, 92, 246);
          pdf.setLineWidth(3);
          pdf.line(settings.marginLeft, y - 2, settings.marginLeft, y + settings.fontSize + 2);
          
          pdf.setFillColor(249, 247, 255);
          pdf.rect(settings.marginLeft + 4, y - 4, contentWidth - 4, settings.fontSize + 6, 'F');
          
          pdf.setFont('helvetica', 'italic');
          pdf.setFontSize(settings.fontSize - 1);
          pdf.setTextColor(100, 100, 100);
          const wrappedQuote = wrapText(text, contentWidth - 10, settings.fontSize - 1);
          
          wrappedQuote.forEach((line: string) => {
            pdf.text(line, settings.marginLeft + 8, y);
            y += settings.fontSize * settings.lineHeight * 0.8;
          });
          
          y += 4;
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(0, 0, 0);
          continue;
        }
      }

      // Ajouter bordures décoratives si activé
      if (settings.addBorders) {
        const totalPages = pdf.internal.pages.length - 1;
        const themeColors = {
          blue: [30, 64, 175],
          cyan: [8, 145, 178],
          purple: [139, 92, 246],
          green: [34, 197, 94],
          orange: [249, 115, 22],
          red: [220, 38, 38],
          pink: [236, 72, 153],
          yellow: [234, 179, 8],
          indigo: [99, 102, 241],
          teal: [20, 184, 166]
        };
        const color = themeColors[settings.themeColor];
        
        for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i);
          pdf.setDrawColor(color[0], color[1], color[2]);
          
          if (settings.borderStyle === 'simple') {
            // Bordure simple
            pdf.setLineWidth(2);
            pdf.rect(10, 10, pageWidth - 20, pageHeight - 20);
          } else if (settings.borderStyle === 'double') {
            // Bordure double
            pdf.setLineWidth(1.5);
            pdf.rect(8, 8, pageWidth - 16, pageHeight - 16);
            pdf.rect(12, 12, pageWidth - 24, pageHeight - 24);
          } else if (settings.borderStyle === 'rounded') {
            // Bordure avec coins arrondis (simulé avec des lignes et petits arcs)
            pdf.setLineWidth(2);
            const radius = 10;
            const x = 10, y = 10, w = pageWidth - 20, h = pageHeight - 20;
            // Lignes horizontales
            pdf.line(x + radius, y, x + w - radius, y);
            pdf.line(x + radius, y + h, x + w - radius, y + h);
            // Lignes verticales
            pdf.line(x, y + radius, x, y + h - radius);
            pdf.line(x + w, y + radius, x + w, y + h - radius);
            // Coins arrondis (simulés avec des petites lignes diagonales)
            pdf.line(x, y + radius, x + radius, y);
            pdf.line(x + w - radius, y, x + w, y + radius);
            pdf.line(x + w, y + h - radius, x + w - radius, y + h);
            pdf.line(x + radius, y + h, x, y + h - radius);
          } else if (settings.borderStyle === 'decorative') {
            // Bordure décorative avec motifs d'angle
            pdf.setLineWidth(2);
            pdf.rect(10, 10, pageWidth - 20, pageHeight - 20);
            // Coins décoratifs
            pdf.setLineWidth(1);
            // Coin haut-gauche
            pdf.line(10, 20, 20, 10);
            pdf.line(10, 25, 25, 10);
            // Coin haut-droit
            pdf.line(pageWidth - 10, 20, pageWidth - 20, 10);
            pdf.line(pageWidth - 10, 25, pageWidth - 25, 10);
            // Coin bas-gauche
            pdf.line(10, pageHeight - 20, 20, pageHeight - 10);
            pdf.line(10, pageHeight - 25, 25, pageHeight - 10);
            // Coin bas-droit
            pdf.line(pageWidth - 10, pageHeight - 20, pageWidth - 20, pageHeight - 10);
            pdf.line(pageWidth - 10, pageHeight - 25, pageWidth - 25, pageHeight - 10);
          } else if (settings.borderStyle === 'gradient') {
            // Bordure avec effet de profondeur (multiple lignes)
            for (let offset = 0; offset < 5; offset++) {
              pdf.setDrawColor(color[0], color[1], color[2]);
              pdf.setLineWidth(1);
              pdf.rect(10 + offset, 10 + offset, pageWidth - 20 - (offset * 2), pageHeight - 20 - (offset * 2));
            }
          }
        }
      }

      // Ajouter en-têtes personnalisés
      if (settings.headerText) {
        const totalPages = pdf.internal.pages.length - 1;
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);
        
        for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i);
          pdf.text(settings.headerText, pageWidth / 2, 15, { align: 'center' });
        }
      }

      // Ajouter pieds de page personnalisés
      if (settings.footerText) {
        const totalPages = pdf.internal.pages.length - 1;
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);
        
        for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i);
          pdf.text(settings.footerText, pageWidth / 2, pageHeight - 5, { align: 'center' });
        }
      }

      // Ajouter numérotation des pages si activé
      if (settings.addPageNumbers) {
        const totalPages = pdf.internal.pages.length - 1;
        pdf.setFontSize(9);
        pdf.setTextColor(150, 150, 150);
        
        const alignments: { [key: string]: 'center' | 'left' | 'right' } = {
          center: 'center',
          left: 'left',
          right: 'right'
        };
        
        const xPositions = {
          center: pageWidth / 2,
          left: settings.marginLeft,
          right: pageWidth - settings.marginRight
        };
        
        for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i);
          pdf.text(
            `Page ${i} / ${totalPages}`,
            xPositions[settings.pageNumberPosition],
            pageHeight - 10,
            { align: alignments[settings.pageNumberPosition] }
          );
        }
      }

      // Ajouter watermark si activé
      if (settings.addWatermark) {
        const totalPages = pdf.internal.pages.length - 1;
        pdf.setFontSize(40);
        pdf.setTextColor(220, 220, 220);
        
        for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i);
          pdf.text(
            'MARKDOWN TO PDF',
            pageWidth / 2,
            pageHeight / 2,
            { 
              align: 'center',
              angle: 45
            }
          );
        }
      }

      pdf.save('document.pdf');
      
      // Enregistrer la conversion SEULEMENT si non-premium
      if (!isPremium) {
        await logConversion(userIP, navigator.userAgent, premiumEmail || undefined);
        
        // Mettre à jour le compteur avec la nouvelle fonction
        const result = await checkConversionAllowed(userIP, premiumEmail || undefined);
        setConversionsToday(result.conversionsUsed);
      }
      
    } catch (error) {
      console.error('Erreur de conversion:', error);
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <>
      <Analytics />
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-sky-50">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-7xl">
          {/* Bannière de bienvenue premium */}
          {showWelcomeBanner && (
            <div className="mb-4 sm:mb-6 bg-gradient-to-r from-green-500 to-cyan-600 text-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base sm:text-xl font-bold">🎉 Bienvenue !</h3>
                  <p className="text-sm sm:text-base text-green-100">Votre compte est maintenant actif.</p>
                </div>
              </div>
              <button
                onClick={() => setShowWelcomeBanner(false)}
                className="text-white hover:text-green-100 transition-colors flex-shrink-0 ml-2"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <header className="text-center mb-6 sm:mb-12">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mb-3 sm:mb-4">
            <img 
              src="/logo.png" 
              alt="Logo MarkdownEnPDF - Convertisseur Markdown vers PDF"
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
            />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-700 bg-clip-text text-transparent leading-tight">
              Convertir Markdown en PDF
            </h1>
          </div>
          <p className="text-slate-700 text-base sm:text-lg md:text-xl font-semibold mb-2 sm:mb-3 px-2">
            Le convertisseur Markdown vers PDF le plus simple et rapide 🚀
          </p>
          <p className="text-slate-600 text-sm sm:text-base max-w-3xl mx-auto px-3">
            Transformez vos fichiers <strong>.md</strong> en documents <strong>PDF professionnels</strong> en quelques secondes.<br className="hidden sm:inline" /><span className="sm:hidden"> </span>100% gratuit, sans inscription, avec support complet du formatage Markdown.
          </p>
        </header>

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-cyan-100">
          <div className="p-6 bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-600">
            <ins className="adsbygoogle"
              style={{ display: 'block' }}
              data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
              data-ad-slot="XXXXXXXXXX"
              data-ad-format="horizontal"
              data-full-width-responsive="true"></ins>
          </div>
          <PremiumBanner 
            conversionsLeft={2 - conversionsToday}
            onLoginClick={() => setShowLoginModal(true)}
            isPremium={isPremium}
            premiumEmail={premiumEmail}
            onLogout={handleLogout}
            userIP={userIP}
          />

          {/* Panneau de réglages - Mise en avant */}
          <div className="p-8 border-b border-cyan-200 bg-gradient-to-r from-cyan-100 via-blue-100 to-cyan-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-cyan-600 text-white p-3 rounded-xl shadow-lg">
                  <SettingsIcon />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-800">Réglages de mise en page</h2>
                  <p className="text-xs sm:text-sm text-slate-600">Personnalisez votre PDF selon vos besoins</p>
                </div>
              </div>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-cyan-600 hover:bg-cyan-700 text-white text-sm sm:text-base font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
              >
                <span>{showSettings ? 'Masquer' : 'Configurer'}</span>
                <svg 
                  className={`w-5 h-5 transition-transform ${showSettings ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            
            {showSettings && (
              <div className="mt-6 p-6 bg-white rounded-2xl shadow-lg border-2 border-cyan-300">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <span className="text-cyan-600">📝</span>
                    Taille du texte
                  </label>
                  <input
                    type="number"
                    min="8"
                    max="16"
                    value={settings.fontSize}
                    onChange={(e) => setSettings({ ...settings, fontSize: Number(e.target.value) })}
                    className="w-full px-4 py-3 border-2 border-cyan-300 rounded-xl text-base font-semibold focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all shadow-sm"
                  />
                  <span className="text-xs text-slate-500 mt-1 block">{settings.fontSize}pt</span>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <span className="text-cyan-600">📏</span>
                    Interligne
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="3"
                    step="0.1"
                    value={settings.lineHeight}
                    onChange={(e) => setSettings({ ...settings, lineHeight: Number(e.target.value) })}
                    className="w-full px-4 py-3 border-2 border-cyan-300 rounded-xl text-base font-semibold focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all shadow-sm"
                  />
                  <span className="text-xs text-slate-500 mt-1 block">×{settings.lineHeight}</span>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <span className="text-cyan-600">↔️</span>
                    Marge gauche/droite
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="40"
                    value={settings.marginLeft}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setSettings({ ...settings, marginLeft: val, marginRight: val });
                    }}
                    className="w-full px-4 py-3 border-2 border-cyan-300 rounded-xl text-base font-semibold focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all shadow-sm"
                  />
                  <span className="text-xs text-slate-500 mt-1 block">{settings.marginLeft}mm</span>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <span className="text-cyan-600">↕️</span>
                    Marge haut/bas
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="40"
                    value={settings.marginTop}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setSettings({ ...settings, marginTop: val, marginBottom: val });
                    }}
                    className="w-full px-4 py-3 border-2 border-cyan-300 rounded-xl text-base font-semibold focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all shadow-sm"
                  />
                  <span className="text-xs text-slate-500 mt-1 block">{settings.marginTop}mm</span>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <span className="text-cyan-600">🔤</span>
                    Taille titre H1
                  </label>
                  <input
                    type="number"
                    min="14"
                    max="28"
                    value={settings.titleSize}
                    onChange={(e) => setSettings({ ...settings, titleSize: Number(e.target.value) })}
                    className="w-full px-4 py-3 border-2 border-cyan-300 rounded-xl text-base font-semibold focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all shadow-sm"
                  />
                  <span className="text-xs text-slate-500 mt-1 block">{settings.titleSize}pt</span>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <span className="text-cyan-600">📰</span>
                    Taille titre H2
                  </label>
                  <input
                    type="number"
                    min="12"
                    max="20"
                    value={settings.subtitleSize}
                    onChange={(e) => setSettings({ ...settings, subtitleSize: Number(e.target.value) })}
                    className="w-full px-4 py-3 border-2 border-cyan-300 rounded-xl text-base font-semibold focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all shadow-sm"
                  />
                  <span className="text-xs text-slate-500 mt-1 block">{settings.subtitleSize}pt</span>
                </div>
                
                {/* Nouvelles options innovantes */}
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <span className="text-cyan-600">🎨</span>
                    Couleur du thème
                  </label>
                  <select
                    value={settings.themeColor}
                    onChange={(e) => setSettings({ ...settings, themeColor: e.target.value as PageSettings['themeColor'] })}
                    className="w-full px-4 py-3 border-2 border-cyan-300 rounded-xl text-base font-semibold focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all shadow-sm bg-white"
                  >
                    <option value="cyan">💎 Cyan</option>
                    <option value="blue">🔷 Bleu</option>
                    <option value="purple">💜 Violet</option>
                    <option value="green">💚 Vert</option>
                    <option value="orange">🧡 Orange</option>
                    <option value="red">❤️ Rouge</option>
                    <option value="pink">💕 Rose</option>
                    <option value="yellow">💛 Jaune</option>
                    <option value="indigo">🔮 Indigo</option>
                    <option value="teal">🌊 Turquoise</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <span className="text-cyan-600">✨</span>
                    Style des titres
                  </label>
                  <select
                    value={settings.titleStyle}
                    onChange={(e) => setSettings({ ...settings, titleStyle: e.target.value as PageSettings['titleStyle'] })}
                    className="w-full px-4 py-3 border-2 border-cyan-300 rounded-xl text-base font-semibold focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all shadow-sm bg-white"
                  >
                    <option value="bold">Gras classique</option>
                    <option value="underline">Souligné</option>
                    <option value="background">Fond coloré</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <span className="text-cyan-600">⬇️</span>
                    Espacement paragraphes
                  </label>
                  <input
                    type="number"
                    min="3"
                    max="15"
                    value={settings.paragraphSpacing}
                    onChange={(e) => setSettings({ ...settings, paragraphSpacing: Number(e.target.value) })}
                    className="w-full px-4 py-3 border-2 border-cyan-300 rounded-xl text-base font-semibold focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all shadow-sm"
                  />
                  <span className="text-xs text-slate-500 mt-1 block">{settings.paragraphSpacing}mm</span>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <span className="text-cyan-600">📍</span>
                    Position numéros
                  </label>
                  <select
                    value={settings.pageNumberPosition}
                    onChange={(e) => setSettings({ ...settings, pageNumberPosition: e.target.value as PageSettings['pageNumberPosition'] })}
                    className="w-full px-4 py-3 border-2 border-cyan-300 rounded-xl text-base font-semibold focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all shadow-sm bg-white"
                  >
                    <option value="center">Centre</option>
                    <option value="left">Gauche</option>
                    <option value="right">Droite</option>
                  </select>
                </div>

                <div className="col-span-2 md:col-span-4">
                  <label className="block text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <span className="text-cyan-600">📋</span>
                    En-tête personnalisé (optionnel)
                  </label>
                  <input
                    type="text"
                    value={settings.headerText}
                    onChange={(e) => setSettings({ ...settings, headerText: e.target.value })}
                    placeholder="Ex: Mon Document - Version 1.0"
                    className="w-full px-4 py-3 border-2 border-cyan-300 rounded-xl text-base focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all shadow-sm"
                  />
                </div>

                <div className="col-span-2 md:col-span-4">
                  <label className="block text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <span className="text-cyan-600">📝</span>
                    Pied de page personnalisé (optionnel)
                  </label>
                  <input
                    type="text"
                    value={settings.footerText}
                    onChange={(e) => setSettings({ ...settings, footerText: e.target.value })}
                    placeholder="Ex: © 2025 - Confidentiel"
                    className="w-full px-4 py-3 border-2 border-cyan-300 rounded-xl text-base focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all shadow-sm"
                  />
                </div>
                
                <div className="flex items-center">
                  <label className="flex items-center gap-3 text-base font-bold text-slate-800 cursor-pointer bg-cyan-50 hover:bg-cyan-100 p-4 rounded-xl border-2 border-cyan-200 transition-all w-full">
                    <input
                      type="checkbox"
                      checked={settings.addPageNumbers}
                      onChange={(e) => setSettings({ ...settings, addPageNumbers: e.target.checked })}
                      className="w-5 h-5 text-cyan-600 border-cyan-300 rounded focus:ring-cyan-500"
                    />
                    <span>📄 Numérotation pages</span>
                  </label>
                </div>
                
                <div className="flex items-center">
                  <label className="flex items-center gap-3 text-base font-bold text-slate-800 cursor-pointer bg-cyan-50 hover:bg-cyan-100 p-4 rounded-xl border-2 border-cyan-200 transition-all w-full">
                    <input
                      type="checkbox"
                      checked={settings.addBorders}
                      onChange={(e) => setSettings({ ...settings, addBorders: e.target.checked })}
                      className="w-5 h-5 text-cyan-600 border-cyan-300 rounded focus:ring-cyan-500"
                    />
                    <span>🎁 Bordures décoratives</span>
                  </label>
                </div>

                {settings.addBorders && (
                  <div>
                    <label className="block text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                      <span className="text-cyan-600">🖼️</span>
                      Style de bordure
                    </label>
                    <select
                      value={settings.borderStyle}
                      onChange={(e) => setSettings({ ...settings, borderStyle: e.target.value as PageSettings['borderStyle'] })}
                      className="w-full px-4 py-3 border-2 border-cyan-300 rounded-xl text-base font-semibold focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all shadow-sm bg-white"
                    >
                      <option value="simple">📐 Simple</option>
                      <option value="double">🎯 Double</option>
                      <option value="rounded">⭕ Coins arrondis</option>
                      <option value="decorative">✨ Décorative</option>
                      <option value="gradient">🌈 Profondeur</option>
                    </select>
                  </div>
                )}

                <div className="flex items-center">
                  <label className="flex items-center gap-3 text-base font-bold text-slate-800 cursor-pointer bg-cyan-50 hover:bg-cyan-100 p-4 rounded-xl border-2 border-cyan-200 transition-all w-full">
                    <input
                      type="checkbox"
                      checked={settings.addWatermark}
                      onChange={(e) => setSettings({ ...settings, addWatermark: e.target.checked })}
                      className="w-5 h-5 text-cyan-600 border-cyan-300 rounded focus:ring-cyan-500"
                    />
                    <span>🔒 Filigrane</span>
                  </label>
                </div>
              </div>
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-2 gap-6 p-8">
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <span role="img" aria-label="Icône étoile">
                  <SparkleIcon />
                </span>
                <span>Éditeur Markdown</span>
              </label>
              <textarea
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                placeholder="# Mon Titre Principal&#x0A;&#x0A;Collez votre contenu **Markdown** ici...&#x0A;&#x0A;## Sous-titre&#x0A;- Liste à puces&#x0A;- Deuxième élément&#x0A;&#x0A;1. Liste numérotée&#x0A;2. Deuxième point&#x0A;&#x0A;[Lien vers site](https://example.com)&#x0A;&#x0A;```python&#x0A;def hello_world():&#x0A;    print('Bonjour monde!')&#x0A;```&#x0A;&#x0A;> Citation en bloc"
                className="w-full h-96 p-4 border-2 border-cyan-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400 outline-none resize-none font-mono text-sm transition-all shadow-sm"
                aria-label="Éditeur de texte Markdown"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <span role="img" aria-label="Icône document">
                  <FileIcon />
                </span>
                <span>Aperçu PDF Stylisé</span>
              </label>
              <div 
                className="w-full h-96 overflow-auto border-2 border-cyan-200 rounded-xl shadow-sm bg-white" 
                role="region" 
                aria-label="Aperçu du rendu PDF avec styles"
              >
                {markdown ? (
                  <div 
                    className="bg-white"
                    style={{
                      padding: `${settings.marginTop}px ${settings.marginRight}px ${settings.marginBottom}px ${settings.marginLeft}px`,
                      fontSize: `${settings.fontSize}px`,
                      lineHeight: settings.lineHeight,
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      position: 'relative',
                    }}
                  >
                    {/* Bordures décoratives si activées */}
                    {settings.addBorders && (
                      <div 
                        style={{
                          position: 'absolute',
                          inset: '10px',
                          border: settings.borderStyle === 'double' ? '2px solid' : '3px solid',
                          borderRadius: settings.borderStyle === 'rounded' ? '10px' : '0',
                          borderColor: (() => {
                            const colors = {
                              blue: '#1e40af',
                              cyan: '#0891b2',
                              purple: '#8b5cf6',
                              green: '#22c55e',
                              orange: '#f97316',
                              red: '#dc2626',
                              pink: '#ec4899',
                              yellow: '#eab308',
                              indigo: '#6366f1',
                              teal: '#14b8a6'
                            };
                            return colors[settings.themeColor];
                          })(),
                          pointerEvents: 'none',
                        }}
                      />
                    )}
                    
                    {/* En-tête personnalisé */}
                    {settings.headerText && (
                      <div 
                        style={{
                          textAlign: 'center',
                          fontSize: '9px',
                          color: '#666',
                          marginBottom: '15px',
                          paddingBottom: '8px',
                          borderBottom: '1px solid #e5e7eb',
                        }}
                      >
                        {settings.headerText}
                      </div>
                    )}
                    
                    {/* Contenu markdown stylisé */}
                    <div 
                      style={{
                        color: '#000',
                        wordWrap: 'break-word',
                      }}
                    >
                      {markdown.split('\n').map((line, idx) => {
                        // Titres H1
                        if (line.startsWith('# ')) {
                          const themeColors = {
                            blue: '#1e40af',
                            cyan: '#0891b2',
                            purple: '#8b5cf6',
                            green: '#22c55e',
                            orange: '#f97316',
                            red: '#dc2626',
                            pink: '#ec4899',
                            yellow: '#eab308',
                            indigo: '#6366f1',
                            teal: '#14b8a6'
                          };
                          const color = themeColors[settings.themeColor];
                          
                          return (
                            <h1 
                              key={idx}
                              style={{
                                fontSize: `${settings.titleSize}px`,
                                fontWeight: 'bold',
                                color: settings.titleStyle === 'background' ? '#fff' : color,
                                backgroundColor: settings.titleStyle === 'background' ? color : 'transparent',
                                padding: settings.titleStyle === 'background' ? '8px 10px' : '4px 0',
                                borderRadius: settings.titleStyle === 'background' ? '6px' : '0',
                                borderBottom: settings.titleStyle === 'underline' ? `3px solid ${color}` : 'none',
                                marginTop: '16px',
                                marginBottom: `${settings.titleSize * 0.5}px`,
                              }}
                            >
                              {line.substring(2)}
                            </h1>
                          );
                        }
                        
                        // Titres H2
                        if (line.startsWith('## ')) {
                          return (
                            <h2 
                              key={idx}
                              style={{
                                fontSize: `${settings.subtitleSize}px`,
                                fontWeight: 'bold',
                                color: '#1e40af',
                                marginTop: '12px',
                                marginBottom: '8px',
                              }}
                            >
                              {line.substring(3)}
                            </h2>
                          );
                        }
                        
                        // Titres H3
                        if (line.startsWith('### ')) {
                          return (
                            <h3 
                              key={idx}
                              style={{
                                fontSize: `${settings.fontSize + 2}px`,
                                fontWeight: 'bold',
                                color: '#1e40af',
                                marginTop: '10px',
                                marginBottom: '6px',
                              }}
                            >
                              {line.substring(4)}
                            </h3>
                          );
                        }
                        
                        // Blocs de code
                        if (line.startsWith('```')) {
                          return <div key={idx} />;
                        }
                        
                        // Listes à puces
                        if (line.match(/^[-*+]\s/)) {
                          return (
                            <div 
                              key={idx}
                              style={{
                                display: 'flex',
                                gap: '8px',
                                marginBottom: '4px',
                                paddingLeft: '0px',
                              }}
                            >
                              <span style={{ color: '#0891b2', fontWeight: 'bold' }}>•</span>
                              <span>{line.substring(2)}</span>
                            </div>
                          );
                        }
                        
                        // Listes numérotées
                        if (line.match(/^\d+\.\s/)) {
                          const match = line.match(/^(\d+)\.\s(.+)$/);
                          if (match) {
                            return (
                              <div 
                                key={idx}
                                style={{
                                  display: 'flex',
                                  gap: '8px',
                                  marginBottom: '4px',
                                }}
                              >
                                <span style={{ fontWeight: 'bold', minWidth: '20px' }}>{match[1]}.</span>
                                <span>{match[2]}</span>
                              </div>
                            );
                          }
                        }
                        
                        // Citations
                        if (line.startsWith('> ')) {
                          return (
                            <div 
                              key={idx}
                              style={{
                                borderLeft: '4px solid #8b5cf6',
                                backgroundColor: '#f9f7ff',
                                padding: '8px 12px',
                                marginTop: '8px',
                                marginBottom: '8px',
                                fontStyle: 'italic',
                                color: '#666',
                              }}
                            >
                              {line.substring(2)}
                            </div>
                          );
                        }
                        
                        // Séparateurs
                        if (line.trim() === '---' || line.trim() === '***') {
                          return (
                            <hr 
                              key={idx}
                              style={{
                                border: 'none',
                                borderTop: '2px solid #d1d5db',
                                margin: '16px 0',
                              }}
                            />
                          );
                        }
                        
                        // Lignes vides
                        if (!line.trim()) {
                          return <div key={idx} style={{ height: `${settings.paragraphSpacing}px` }} />;
                        }
                        
                        // Paragraphes avec formatage inline
                        const processInlineFormatting = (text: string) => {
                          const parts: React.ReactNode[] = [];
                          let remaining = text;
                          let key = 0;
                          
                          // Gras
                          const boldRegex = /\*\*(.+?)\*\*/g;
                          remaining = remaining.replace(boldRegex, (_match, content) => {
                            parts.push(<strong key={`bold-${key++}`}>{content}</strong>);
                            return `__PART_${parts.length - 1}__`;
                          });
                          
                          // Italique
                          const italicRegex = /\*(.+?)\*/g;
                          remaining = remaining.replace(italicRegex, (_match, content) => {
                            parts.push(<em key={`italic-${key++}`}>{content}</em>);
                            return `__PART_${parts.length - 1}__`;
                          });
                          
                          // Code inline
                          const codeRegex = /`(.+?)`/g;
                          remaining = remaining.replace(codeRegex, (_match, content) => {
                            parts.push(
                              <code 
                                key={`code-${key++}`} 
                                style={{
                                  backgroundColor: '#f3f4f6',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontFamily: 'monospace',
                                  fontSize: '0.9em',
                                  color: '#dc2626',
                                }}
                              >
                                {content}
                              </code>
                            );
                            return `__PART_${parts.length - 1}__`;
                          });
                          
                          // Liens
                          const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
                          remaining = remaining.replace(linkRegex, (_match, text, url) => {
                            parts.push(
                              <a 
                                key={`link-${key++}`} 
                                href={url}
                                style={{ color: '#0891b2', textDecoration: 'underline' }}
                              >
                                {text}
                              </a>
                            );
                            return `__PART_${parts.length - 1}__`;
                          });
                          
                          // Reconstituer le texte
                          const finalParts: React.ReactNode[] = [];
                          remaining.split(/(__PART_\d+__)/g).forEach((segment) => {
                            const partMatch = segment.match(/__PART_(\d+)__/);
                            if (partMatch) {
                              finalParts.push(parts[parseInt(partMatch[1])]);
                            } else if (segment) {
                              finalParts.push(segment);
                            }
                          });
                          
                          return finalParts.length > 0 ? finalParts : text;
                        };
                        
                        return (
                          <p 
                            key={idx}
                            style={{
                              marginBottom: `${settings.paragraphSpacing}px`,
                              textAlign: 'left',
                            }}
                          >
                            {processInlineFormatting(line)}
                          </p>
                        );
                      })}
                    </div>
                    
                    {/* Pied de page personnalisé */}
                    {settings.footerText && (
                      <div 
                        style={{
                          textAlign: 'center',
                          fontSize: '9px',
                          color: '#666',
                          marginTop: '20px',
                          paddingTop: '8px',
                          borderTop: '1px solid #e5e7eb',
                        }}
                      >
                        {settings.footerText}
                      </div>
                    )}
                    
                    {/* Numéro de page */}
                    {settings.addPageNumbers && (
                      <div 
                        style={{
                          textAlign: settings.pageNumberPosition,
                          fontSize: '9px',
                          color: '#999',
                          marginTop: '12px',
                        }}
                      >
                        Page 1 / 1
                      </div>
                    )}
                    
                    {/* Watermark */}
                    {settings.addWatermark && (
                      <div 
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%) rotate(45deg)',
                          fontSize: '40px',
                          color: 'rgba(220, 220, 220, 0.3)',
                          fontWeight: 'bold',
                          pointerEvents: 'none',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        MARKDOWN TO PDF
                      </div>
                    )}
                  </div>
                ) : (
                  <p 
                    className="text-slate-400 italic p-6"
                    style={{ fontSize: '14px' }}
                  >
                    Votre aperçu PDF stylisé apparaîtra ici avec toutes vos personnalisations (couleurs, marges, bordures, etc.)...
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="px-4 sm:px-8 pb-6 sm:pb-8">
            <button
              onClick={handleConvert}
              disabled={!markdown.trim() || isConverting}
              className="w-full bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-600 hover:from-cyan-600 hover:via-blue-700 hover:to-cyan-700 text-white font-bold py-4 sm:py-5 px-4 sm:px-8 rounded-xl transition-all transform hover:scale-[1.02] hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-xl flex items-center justify-center gap-2 sm:gap-3 text-base sm:text-lg"
              aria-label="Télécharger le document en format PDF"
            >
              <span role="img" aria-label="Icône téléchargement" className="flex-shrink-0">
                <DownloadIcon />
              </span>
              <span className="text-sm sm:text-base md:text-lg">{isConverting ? 'Conversion...' : 'Télécharger en PDF Gratuit 🎉'}</span>
              {isConverting && (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-label="Chargement en cours">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
            </button>
            <p className="text-center text-sm text-slate-500 mt-3">
              ✨ Aucune inscription requise • 100% gratuit • Conversion instantanée
            </p>
          </div>
        </div>

        {/* Premium Banner - Sous l'éditeur (seulement pour non-premium) */}
        <div className="mt-6">
          
          {/* Boutons si non connecté */}
          {!isPremium && !premiumEmail && (
            <div className="mt-4 text-center space-y-2">
              <button
                onClick={() => setShowRegisterModal(true)}
                data-register-trigger
                className="text-sm text-gray-600 hover:text-gray-700 font-medium underline"
              >
                Créer un compte gratuit (2/jour)
              </button>
              <div className="text-xs text-gray-500">
                ou
              </div>
              <button
                onClick={() => setShowLoginModal(true)}
                className="text-sm text-cyan-600 hover:text-cyan-700 font-medium underline"
              >
                Se connecter
              </button>
            </div>
          )}
        </div>

        {/* Section Caractéristiques & Avantages */}
        <section className="mt-12 mb-8" aria-labelledby="features-heading">
          <h2 id="features-heading" className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
            Pourquoi choisir MarkdownEnPDF.com ?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <article className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-cyan-100 hover:shadow-xl transition-shadow">
              <div className="text-cyan-600 mb-4" role="img" aria-label="Icône éclair">
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-800">Conversion Instantanée</h3>
              <p className="text-slate-600">
                Transformez vos fichiers <strong>Markdown en PDF en quelques secondes</strong>. Pas d'attente, pas de file d'attente. Conversion ultra-rapide directement dans votre navigateur.
              </p>
            </article>

            <article className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg p-8 text-white hover:shadow-xl transition-shadow">
              <div className="mb-4" role="img" aria-label="Icône étoile">
                <SparkleIcon />
              </div>
              <h3 className="text-xl font-bold mb-3">Rendu Professionnel</h3>
              <p className="text-orange-50">
                <strong>Typographie premium</strong>, mise en page soignée, support complet du formatage : titres, listes, code, tableaux, liens. Vos PDFs ont fière allure !
              </p>
            </article>

            <article className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-cyan-100 hover:shadow-xl transition-shadow">
              <div className="text-cyan-600 mb-4" role="img" aria-label="Icône cadenas">
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-800">100% Sécurisé & Privé</h3>
              <p className="text-slate-600">
                <strong>Vos données restent privées</strong>. Tout se passe dans votre navigateur. Aucun fichier n'est envoyé sur nos serveurs. Zéro risque de fuite de données.
              </p>
            </article>
          </div>
        </section>

        {/* Section Fonctionnalités détaillées */}
        <section className="mt-12 mb-8 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-cyan-100" aria-labelledby="details-heading">
          <h2 id="details-heading" className="text-3xl font-bold text-center mb-8 text-slate-800">
            Toutes les fonctionnalités Markdown supportées
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-cyan-600 text-2xl" role="img" aria-label="Validé">✓</span>
                <div>
                  <h4 className="font-bold text-slate-800">Titres H1 à H6</h4>
                  <p className="text-sm text-slate-600">Hiérarchie complète avec tailles personnalisables</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-cyan-600 text-2xl" role="img" aria-label="Validé">✓</span>
                <div>
                  <h4 className="font-bold text-slate-800">Formatage de texte</h4>
                  <p className="text-sm text-slate-600">Gras, italique, gras+italique, code inline</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-cyan-600 text-2xl" role="img" aria-label="Validé">✓</span>
                <div>
                  <h4 className="font-bold text-slate-800">Listes à puces & numérotées</h4>
                  <p className="text-sm text-slate-600">Multi-niveaux avec indentation automatique</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-cyan-600 text-2xl" role="img" aria-label="Validé">✓</span>
                <div>
                  <h4 className="font-bold text-slate-800">Blocs de code</h4>
                  <p className="text-sm text-slate-600">Avec coloration syntaxique et fond grisé</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-cyan-600 text-2xl" role="img" aria-label="Validé">✓</span>
                <div>
                  <h4 className="font-bold text-slate-800">Liens hypertextes</h4>
                  <p className="text-sm text-slate-600">Liens cliquables avec texte personnalisé</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-cyan-600 text-2xl" role="img" aria-label="Validé">✓</span>
                <div>
                  <h4 className="font-bold text-slate-800">Citations (blockquotes)</h4>
                  <p className="text-sm text-slate-600">Mise en forme élégante avec bordure colorée</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-cyan-600 text-2xl" role="img" aria-label="Validé">✓</span>
                <div>
                  <h4 className="font-bold text-slate-800">Séparateurs horizontaux</h4>
                  <p className="text-sm text-slate-600">Pour structurer vos documents</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-cyan-600 text-2xl" role="img" aria-label="Validé">✓</span>
                <div>
                  <h4 className="font-bold text-slate-800">Numérotation des pages</h4>
                  <p className="text-sm text-slate-600">Option pour ajouter numéros de page automatiques</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section FAQ */}
        <section className="mt-12 mb-8" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
            Questions Fréquentes (FAQ)
          </h2>
          
          <div className="space-y-4 max-w-4xl mx-auto">
            <details className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-cyan-100">
              <summary className="font-bold text-lg text-slate-800 cursor-pointer hover:text-cyan-600 transition-colors">
                Comment convertir un fichier Markdown en PDF gratuitement ?
              </summary>
              <p className="mt-4 text-slate-600">
                C'est très simple ! Copiez votre contenu Markdown dans l'éditeur ci-dessus, personnalisez les réglages de mise en page si vous le souhaitez (marges, taille de police, etc.), puis cliquez sur le bouton "Télécharger en PDF". La conversion est instantanée et 100% gratuite.
              </p>
            </details>
            
            <details className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-cyan-100">
              <summary className="font-bold text-lg text-slate-800 cursor-pointer hover:text-cyan-600 transition-colors">
                Est-ce que mes documents sont sécurisés ?
              </summary>
              <p className="mt-4 text-slate-600">
                Absolument ! Toute la conversion se fait localement dans votre navigateur web. Vos fichiers Markdown et PDF ne sont jamais envoyés sur nos serveurs. Vos données restent 100% privées et sécurisées sur votre appareil.
              </p>
            </details>
            
            <details className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-cyan-100">
              <summary className="font-bold text-lg text-slate-800 cursor-pointer hover:text-cyan-600 transition-colors">
                Quels éléments Markdown sont supportés ?
              </summary>
              <p className="mt-4 text-slate-600">
                Nous supportons tous les éléments Markdown standards : titres (H1 à H6), paragraphes, <strong>gras</strong>, <em>italique</em>, listes à puces et numérotées multi-niveaux, code inline et blocs de code, liens hypertextes, citations (blockquotes), séparateurs horizontaux, et bien plus encore !
              </p>
            </details>
            
            <details className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-cyan-100">
              <summary className="font-bold text-lg text-slate-800 cursor-pointer hover:text-cyan-600 transition-colors">
                Y a-t-il des limites d'utilisation ?
              </summary>
              <p className="mt-4 text-slate-600">
                Non, aucune limite ! Vous pouvez convertir autant de documents Markdown en PDF que vous le souhaitez, sans restriction. Pas de compte à créer, pas d'abonnement, pas de limite quotidienne. C'est totalement gratuit et illimité.
              </p>
            </details>
            
            <details className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-cyan-100">
              <summary className="font-bold text-lg text-slate-800 cursor-pointer hover:text-cyan-600 transition-colors">
                Puis-je personnaliser le rendu PDF ?
              </summary>
              <p className="mt-4 text-slate-600">
                Oui ! Cliquez sur "Réglages de mise en page" pour personnaliser : taille du texte, interligne, marges (haut/bas/gauche/droite), taille des titres H1 et H2, numérotation des pages, et même ajouter un filigrane optionnel. Créez des PDFs exactement comme vous les voulez !
              </p>
            </details>
          </div>
        </section>

        {/* Bannière fonctionnalités avancées */}
        <section className="mt-12 mb-8 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 rounded-3xl shadow-2xl p-10 text-white">
          <div className="grid md:grid-cols-3 gap-8 items-center">
            <article className="text-center">
              <div className="text-6xl mb-4">⚡</div>
              <h3 className="text-2xl font-bold mb-3">Rapide & Léger</h3>
              <p className="text-orange-50">
                Conversion instantanée sans installation de logiciel. Fonctionne sur tous les navigateurs modernes : Chrome, Firefox, Safari, Edge.
              </p>
            </article>

            <article className="text-center border-x-2 border-orange-400/30 px-6">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-2xl font-bold mb-3">8 Options Premium</h3>
              <p className="text-orange-50">
                Couleurs de thème, styles de titres, bordures décoratives, en-têtes/pieds de page personnalisés. Créez des PDFs uniques !
              </p>
            </article>

            <article className="text-center">
              <div className="text-6xl mb-4">🌍</div>
              <h3 className="text-2xl font-bold mb-3">100% Français</h3>
              <p className="text-orange-50">
                Interface entièrement en français. Support client francophone. Optimisé pour le public français, belge, suisse et canadien.
              </p>
            </article>
          </div>
        </section>

        {/* Call to Action final */}
        <section className="mt-12 mb-8 text-center bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-600 rounded-3xl shadow-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">
            Prêt à convertir vos fichiers Markdown en PDF ?
          </h2>
          <p className="text-xl text-cyan-50 mb-6 max-w-2xl mx-auto">
            Rejoignez les milliers d'utilisateurs qui font confiance à <strong>MarkdownEnPDF.com</strong> pour leurs conversions quotidiennes.
          </p>
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="bg-white text-cyan-600 font-bold py-4 px-8 rounded-xl hover:bg-cyan-50 transition-all transform hover:scale-105 shadow-lg"
            aria-label="Commencer à convertir maintenant"
          >
            Commencer Maintenant - 100% Gratuit 🚀
          </button>
        </section>

        <footer className="mt-12 text-center text-slate-600 text-sm space-y-2" role="contentinfo">
          <p className="font-medium">© 2025 <strong>MarkdownEnPDF.com</strong> - Convertisseur Markdown vers PDF professionnel et gratuit</p>
          <p className="text-xs">
            <span className="inline-block mx-2">Markdown to PDF</span> •
            <span className="inline-block mx-2">Convertir MD en PDF</span> •
            <span className="inline-block mx-2">Export Markdown</span> •
            <span className="inline-block mx-2">Générateur PDF</span>
          </p>
        </footer>
        
        <footer className="mt-6 text-center text-xs text-slate-500">
          <a href="/privacy.html" className="hover:text-cyan-600 hover:underline mx-2" target="_blank" rel="noopener noreferrer">
            Politique de confidentialité
          </a>
          •
          <a href="/terms.html" className="hover:text-cyan-600 hover:underline mx-2" target="_blank" rel="noopener noreferrer">
            Conditions d'utilisation
          </a>
          •
          <a href="/about.html" className="hover:text-cyan-600 hover:underline mx-2" target="_blank" rel="noopener noreferrer">
            À propos
          </a>
          •
          <a href="/contact.html" className="hover:text-cyan-600 hover:underline mx-2" target="_blank" rel="noopener noreferrer">
            Contact
          </a>
          •
          <span className="mx-2">© 2025 MarkdownEnPDF.com</span>
        </footer>
      </div>
      
      {/* Cookie Banner */}
      {showCookieBanner && <CookieBanner onAccept={handleAcceptCookies} />}
      
      {/* Login Modal */}
      {showLoginModal && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 shadow-2xl">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
              <p className="text-gray-600 mt-4 text-center">Chargement...</p>
            </div>
          </div>
        }>
          <LoginModal 
            onClose={() => setShowLoginModal(false)}
            onLoginSuccess={handleLoginSuccess}
          />
        </Suspense>
      )}
      
      {/* Register Modal */}
      {showRegisterModal && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 shadow-2xl">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
              <p className="text-gray-600 mt-4 text-center">Chargement...</p>
            </div>
          </div>
        }>
          <RegisterModal 
            isOpen={showRegisterModal}
            onClose={() => setShowRegisterModal(false)}
            onRegisterSuccess={handleRegisterSuccess}
          />
        </Suspense>
      )}
      
      {/* Upgrade Modal */}
      <Suspense fallback={
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 shadow-2xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
            <p className="text-gray-600 mt-4 text-center">Chargement...</p>
          </div>
        </div>
      }>
        <UpgradeModal 
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          onUpgrade={handleUpgrade}
        />
      </Suspense>
    </div>
    </>
  );
}

export default App;
