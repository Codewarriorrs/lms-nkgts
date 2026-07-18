import { IsString, IsOptional, IsObject, registerDecorator, ValidationOptions, ValidationArguments } from "class-validator";

export function IsSafeDetailJawaban(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: "isSafeDetailJawaban",
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!value || typeof value !== "object") return true;

          const checkStringLengths = (obj: any): boolean => {
            for (const key in obj) {
              if (Object.prototype.hasOwnProperty.call(obj, key)) {
                const val = obj[key];
                const isPhotoKey = key.toLowerCase().includes("foto") || key.toLowerCase().includes("image");
                
                if (typeof val === "string") {
                  const isUrl = val.startsWith("http://") || val.startsWith("https://");
                  const isBase64 = val.startsWith("data:image");
                  if (isPhotoKey || isUrl || isBase64) {
                    continue;
                  }
                  if (val.length > 1000) return false;
                } else if (Array.isArray(val)) {
                  if (isPhotoKey) continue;
                  for (const el of val) {
                    if (typeof el === "string") {
                      const isUrl = el.startsWith("http://") || el.startsWith("https://");
                      const isBase64 = el.startsWith("data:image");
                      if (isUrl || isBase64) {
                        continue;
                      }
                      if (el.length > 1000) return false;
                    }
                    if (typeof el === "object" && el !== null && !checkStringLengths(el)) return false;
                  }
                } else if (typeof val === "object" && val !== null) {
                  if (!checkStringLengths(val)) return false;
                }
              }
            }
            return true;
          };

          return checkStringLengths(value);
        },
        defaultMessage(args: ValidationArguments) {
          return "Panjang teks jawaban tidak boleh melebihi 1000 karakter (atau 2000 karakter untuk URL)!";
        }
      },
    });
  };
}

export class CreateTugasPraktekDto {
    @IsOptional()
    @IsString()
    tanggal?: string; // Menampung task.date (YYYY-MM-DD)

    @IsOptional()
    @IsString()
    area_pengisian?: string; // Menampung task.area

    @IsOptional()
    @IsString({ message: 'Keterangan harus berupa teks' })
    keterangan?: string; // Menampung task.note

    @IsOptional()
    @IsObject()
    @IsSafeDetailJawaban()
    detail_jawaban?: any; // Objek JSON dinamis
}