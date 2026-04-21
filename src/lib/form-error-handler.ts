import { isAxiosError } from 'axios';
import { toast } from 'sonner';
import { type FieldPath, type FieldValues, type UseFormReturn } from 'react-hook-form';

type HandleFormErrorOptions<TFieldValues extends FieldValues> = {
  error: unknown;
  fallbackMessage: string;
  form: Pick<UseFormReturn<TFieldValues>, 'getValues' | 'setError'>;
  logError?: (error: unknown) => void;
};

type ApiErrorPayload = {
  status?: boolean;
  detail?: string;
  message?: string;
  errors?: unknown;
  fieldErrors?: unknown;
};

type NormalizedFieldErrors = Record<string, string[]>;

const normalizeFieldErrors = (value: unknown): NormalizedFieldErrors => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value as Record<string, unknown>).reduce<NormalizedFieldErrors>(
    (acc, [key, raw]) => {
      if (Array.isArray(raw)) {
        const messages = raw
          .map((item) => (typeof item === 'string' ? item : String(item)))
          .filter(Boolean);
        if (messages.length > 0) {
          acc[key] = messages;
        }
        return acc;
      }

      if (typeof raw === 'string' && raw.trim()) {
        acc[key] = [raw];
      }

      return acc;
    },
    {}
  );
};

const extractToastMessage = (error: unknown, fallbackMessage: string) => {
  if (isAxiosError(error)) {
    const data = error.response?.data as ApiErrorPayload | undefined;

    if (typeof data?.message === 'string' && data.message.trim()) {
      return data.message;
    }

    if (typeof data?.detail === 'string' && data.detail.trim()) {
      return data.detail;
    }

    if (typeof data?.errors === 'string' && data.errors.trim()) {
      return data.errors;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
};

export const handleFormMutationError = <TFieldValues extends FieldValues>({
  error,
  fallbackMessage,
  form,
  logError
}: HandleFormErrorOptions<TFieldValues>) => {
  const toastMessage = extractToastMessage(error, fallbackMessage);
  const formKeys = new Set(Object.keys(form.getValues() as Record<string, unknown>));

  if (isAxiosError(error)) {
    const data = error.response?.data as ApiErrorPayload | undefined;
    const mappedErrors = normalizeFieldErrors(data?.fieldErrors);
    const directErrors = normalizeFieldErrors(data?.errors);
    const fieldErrors = {
      ...mappedErrors,
      ...directErrors
    };

    let mappedFieldErrorCount = 0;
    const unknownFieldMessages: string[] = [];

    Object.entries(fieldErrors).forEach(([key, messages]) => {
      if (!messages.length) {
        return;
      }

      if (formKeys.has(key)) {
        form.setError(key as FieldPath<TFieldValues>, { message: messages[0] });
        mappedFieldErrorCount += 1;
        return;
      }

      unknownFieldMessages.push(`${key}: ${messages[0]}`);
    });

    if (unknownFieldMessages.length > 0) {
      form.setError('root', { message: unknownFieldMessages.join(' | ') });
    } else if (mappedFieldErrorCount === 0) {
      form.setError('root', { message: toastMessage });
    }
  } else {
    form.setError('root', { message: toastMessage });
  }

  toast.error(toastMessage);
  logError?.(error);
};
