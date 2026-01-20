import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button'; // Assuming button exists, if not I'll use standard button
import { Globe } from 'lucide-react';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'he' : 'en';
        i18n.changeLanguage(newLang);
    };

    useEffect(() => {
        document.body.dir = i18n.dir();
        // Force reload to apply direction changes cleanly if needed, 
        // but react usually handles it if we pass dir to components.
        // For now, let's just set the attribute.
        document.documentElement.dir = i18n.dir();
        document.documentElement.lang = i18n.language;
    }, [i18n.language]);

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="flex items-center gap-2"
        >
            <Globe className="w-4 h-4" />
            {i18n.language === 'en' ? 'עברית' : 'English'}
        </Button>
    );
};

export default LanguageSwitcher;
