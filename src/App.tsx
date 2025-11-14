import { useState } from 'react';
import { FileText, Download, Sparkles } from 'lucide-react';
import { marked } from 'marked';
import jsPDF from 'jspdf';

function App() {
  const [markdown, setMarkdown] = useState('');
  const [isConverting, setIsConverting] = useState(false);

  const handleConvert = async () => {
    if (!markdown.trim()) return;

    setIsConverting(true);

    try {
      const html = await marked.parse(markdown);
      const pdf = new jsPDF();

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      const text = tempDiv.textContent || tempDiv.innerText || '';

      const lines = pdf.splitTextToSize(text, 180);
      let y = 20;

      lines.forEach((line: string) => {
        if (y > 280) {
          pdf.addPage();
          y = 20;
        }
        pdf.text(line, 15, y);
        y += 7;
      });

      pdf.save('document.pdf');
    } catch (error) {
      console.error('Erreur de conversion:', error);
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FileText className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-slate-800">Markdown to PDF</h1>
          </div>
          <p className="text-slate-600 text-lg">Convertissez votre Markdown en PDF instantanément</p>
        </header>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-700">
            <ins className="adsbygoogle"
              style={{ display: 'block' }}
              data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
              data-ad-slot="XXXXXXXXXX"
              data-ad-format="horizontal"
              data-full-width-responsive="true"></ins>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 p-8">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                <Sparkles className="w-4 h-4 inline mr-2" />
                Écrivez votre Markdown
              </label>
              <textarea
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                placeholder="# Titre&#x0A;&#x0A;Votre contenu en **Markdown** ici...&#x0A;&#x0A;- Liste item 1&#x0A;- Liste item 2&#x0A;&#x0A;[Lien](https://example.com)"
                className="w-full h-96 p-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none font-mono text-sm transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                <FileText className="w-4 h-4 inline mr-2" />
                Aperçu
              </label>
              <div className="w-full h-96 p-4 border-2 border-slate-200 rounded-xl bg-slate-50 overflow-auto prose prose-sm max-w-none">
                {markdown ? (
                  <div dangerouslySetInnerHTML={{ __html: marked.parse(markdown) }} />
                ) : (
                  <p className="text-slate-400 italic">L'aperçu apparaîtra ici...</p>
                )}
              </div>
            </div>
          </div>

          <div className="px-8 pb-8">
            <button
              onClick={handleConvert}
              disabled={!markdown.trim() || isConverting}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-8 rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg flex items-center justify-center gap-3"
            >
              <Download className="w-5 h-5" />
              {isConverting ? 'Conversion en cours...' : 'Télécharger en PDF'}
            </button>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
          <ins className="adsbygoogle"
            style={{ display: 'block' }}
            data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
            data-ad-slot="XXXXXXXXXX"
            data-ad-format="auto"
            data-full-width-responsive="true"></ins>
        </div>

        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <ins className="adsbygoogle"
              style={{ display: 'block', minHeight: '250px' }}
              data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
              data-ad-slot="XXXXXXXXXX"
              data-ad-format="vertical"></ins>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-3">Simple et Rapide</h3>
            <p className="text-slate-600 text-sm">Convertissez vos documents Markdown en PDF en quelques secondes seulement.</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <ins className="adsbygoogle"
              style={{ display: 'block', minHeight: '250px' }}
              data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
              data-ad-slot="XXXXXXXXXX"
              data-ad-format="vertical"></ins>
          </div>
        </div>

        <footer className="mt-12 text-center text-slate-600 text-sm">
          <p>© 2025 Markdown to PDF - Conversion gratuite et instantanée</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
