import { Download, FileArchive, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function DownloadExportPage() {
  const handleDownload = (filename: string) => {
    const link = document.createElement('a');
    link.href = `/${filename}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            📦 Descarga Tu Aplicación Completa
          </h1>
          <p className="text-xl text-muted-foreground mb-4">
            LiveStream Platform - 100% Descargable y Lista para Usar
          </p>
          <p className="text-muted-foreground">
            Código fuente completo, base de datos, documentación y todo lo necesario para ejecutar tu aplicación
          </p>
        </div>

        {/* Alert */}
        <Alert className="mb-8 border-primary/50 bg-primary/5">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          <AlertDescription className="text-base">
            Both files are ready for immediate download. Choose the package that fits your needs.
          </AlertDescription>
        </Alert>

        {/* Download Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Complete Source Code */}
          <Card className="border-2 border-primary shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <FileArchive className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle className="text-2xl">Complete Source Code</CardTitle>
                  <CardDescription className="text-base">Recommended</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">File size:</span>
                  <span className="font-mono font-semibold">306.6 KB</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Files included:</span>
                  <span className="font-mono font-semibold">216 files</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Format:</span>
                  <span className="font-mono font-semibold">.tar.gz</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm font-semibold mb-2">Includes:</p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>✓ Full source code (src/)</li>
                  <li>✓ Public assets</li>
                  <li>✓ Database migrations</li>
                  <li>✓ Configuration files</li>
                  <li>✓ Complete documentation</li>
                </ul>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm font-semibold mb-2 text-amber-600">Excludes:</p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>✗ node_modules (run npm install)</li>
                  <li>✗ dist folder (run npm run build)</li>
                </ul>
              </div>

              <Button
                onClick={() => handleDownload('COMPLETE_SOURCE_CODE_NO_MODULES.tar.gz')}
                className="w-full h-12 text-base"
                size="lg"
              >
                <Download className="mr-2 h-5 w-5" />
                Download Source Code
              </Button>
            </CardContent>
          </Card>

          {/* Documentation Only */}
          <Card className="border-2 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <FileText className="h-8 w-8 text-blue-600" />
                <div>
                  <CardTitle className="text-2xl">Documentation Only</CardTitle>
                  <CardDescription className="text-base">Reference guides</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">File size:</span>
                  <span className="font-mono font-semibold">26.8 KB</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Files included:</span>
                  <span className="font-mono font-semibold">9 files</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Format:</span>
                  <span className="font-mono font-semibold">.tar.gz</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm font-semibold mb-2">Includes:</p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>✓ Deployment Guide (67 pages)</li>
                  <li>✓ Export Instructions</li>
                  <li>✓ Database Schema (SQL)</li>
                  <li>✓ Quick Start Guide</li>
                  <li>✓ Environment template</li>
                </ul>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Perfect for reference and planning your deployment strategy.
                </p>
              </div>

              <Button
                onClick={() => handleDownload('LIVESTREAM_PLATFORM_COMPLETE_EXPORT.tar.gz')}
                variant="outline"
                className="w-full h-12 text-base"
                size="lg"
              >
                <Download className="mr-2 h-5 w-5" />
                Download Documentation
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">After Download</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  1
                </div>
                <div>
                  <p className="font-semibold">Extract the archive</p>
                  <code className="text-sm bg-muted px-2 py-1 rounded mt-1 block">
                    tar -xzf COMPLETE_SOURCE_CODE_NO_MODULES.tar.gz
                  </code>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  2
                </div>
                <div>
                  <p className="font-semibold">Install dependencies</p>
                  <code className="text-sm bg-muted px-2 py-1 rounded mt-1 block">
                    npm install
                  </code>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  3
                </div>
                <div>
                  <p className="font-semibold">Configure environment</p>
                  <code className="text-sm bg-muted px-2 py-1 rounded mt-1 block">
                    cp env.example .env
                  </code>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  4
                </div>
                <div>
                  <p className="font-semibold">Setup database and run</p>
                  <code className="text-sm bg-muted px-2 py-1 rounded mt-1 block">
                    npm run db:migrate && npm run dev
                  </code>
                </div>
              </div>
            </div>

            <Alert className="mt-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Need help?</strong> Check the included COMPLETE_EXPORT_README.md file for detailed deployment instructions.
              </AlertDescription>
            </Alert>

            <div className="mt-6 space-y-3">
              <Button
                onClick={() => handleDownload('COMPLETE_DOWNLOAD_GUIDE.md')}
                variant="outline"
                className="w-full"
              >
                <FileText className="mr-2 h-4 w-4" />
                Descargar Guía Completa de Instalación
              </Button>
              <Button
                onClick={() => handleDownload('README_ES.md')}
                variant="outline"
                className="w-full"
              >
                <FileText className="mr-2 h-4 w-4" />
                Descargar README en Español
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Direct Links Section */}
        <Card className="mt-8 bg-muted/50">
          <CardHeader>
            <CardTitle className="text-lg">Direct Download Links</CardTitle>
            <CardDescription>
              If the download buttons don't work, use these direct links:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 p-3 bg-background rounded border">
              <FileArchive className="h-5 w-5 text-primary flex-shrink-0" />
              <a
                href="/COMPLETE_SOURCE_CODE_NO_MODULES.tar.gz"
                download
                className="text-sm font-mono text-primary hover:underline break-all"
              >
                /COMPLETE_SOURCE_CODE_NO_MODULES.tar.gz
              </a>
            </div>
            <div className="flex items-center gap-2 p-3 bg-background rounded border">
              <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <a
                href="/LIVESTREAM_PLATFORM_COMPLETE_EXPORT.tar.gz"
                download
                className="text-sm font-mono text-primary hover:underline break-all"
              >
                /LIVESTREAM_PLATFORM_COMPLETE_EXPORT.tar.gz
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-muted-foreground">
          <p>Files are hosted on this server and ready for immediate download.</p>
          <p className="mt-2">
            Total package size: <span className="font-semibold">333.4 KB</span> (both files)
          </p>
        </div>
      </div>
    </div>
  );
}
