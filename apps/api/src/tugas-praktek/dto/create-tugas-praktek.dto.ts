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
                if (typeof val === "string") {
                  if (val.length > 1000) return false;
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
          return "Panjang teks jawaban tidak boleh melebihi 1000 karakter!";
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