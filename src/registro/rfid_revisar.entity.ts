import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity("rfid_revisar")
export class RFIDRevisar {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  RFID: string;

  @Column({ type: "boolean", default: false })
  revisado: boolean;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  dataEnvio: Date;
}
