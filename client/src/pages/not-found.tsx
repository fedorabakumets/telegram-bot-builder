/**
 * Компонент страницы "404 Not Found" для отображения при переходе на несуществующую страницу.
 *
 * @component
 * @example
 * // Использование компонента:
 * import NotFound from '@/pages/not-found';
 *
 * return <NotFound />;
 *
 * @returns {JSX.Element} Возвращает JSX элемент, представляющий собой страницу с ошибкой 404.
 * Страница содержит карточку с иконкой предупреждения, заголовком "404 Page Not Found" и
 * текстом с подсказкой о возможной причине ошибки.
 */
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound(): JSX.Element {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            Вы забыли добавить страницу в маршрутизатор?
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
