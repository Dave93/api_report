import {MigrationInterface, QueryRunner, TableColumn} from "typeorm";
const tableName = 'admin.users';
export class userToProject1644325106601 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(tableName, new TableColumn({
            name: 'project',
            type: 'varchar',
            length: '255',
            isNullable: true,
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn(tableName, "project");
    }

}
