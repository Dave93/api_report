import {MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from "typeorm";
const tableName = 'admin.users';
export class iikoTerminalUser1642587050884 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(tableName, new TableColumn({
            name: 'iiko_terminal_id',
            type: 'uuid',
            isNullable: true,
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn(tableName, "iiko_terminal_id");
    }

}
