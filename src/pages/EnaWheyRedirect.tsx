import { useEffect } from 'react';

const EnaWheyRedirect = () => {
  useEffect(() => {
    // Немедленная переадресация на основной сайт
    window.location.replace('https://ola.lovable.app/');
  }, []);

  // Резервное сообщение на случай, если JS отключен или редирект не сработал
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold text-foreground mb-4">Перенаправление...</h1>
        <p className="text-muted-foreground mb-6">
          Вы будете автоматически перенаправлены на основной сайт.
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          Если переадресация не произошла автоматически, нажмите на ссылку ниже:
        </p>
        <a 
          href="https://ola.lovable.app/" 
          className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
        >
          Перейти на ola.lovable.app
        </a>
      </div>
    </div>
  );
};

export default EnaWheyRedirect;