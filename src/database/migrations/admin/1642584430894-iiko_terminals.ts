import {MigrationInterface, QueryRunner, Table } from "typeorm";
import { commonFields } from '../common.fields';

const tableName = 'iiko_terminals';
export class iikoTerminals1642584430894 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: tableName,
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        isGenerated: true,
                        isNullable: false,
                    },
                    {
                        name: 'iiko_id',
                        type: 'varchar',
                        length: '255',
                        isNullable: false,
                    },
                    {
                        name: 'name',
                        type: 'varchar',
                        length: '100',
                        isNullable: false,
                    },
                    {
                        name: 'active',
                        type: 'boolean',
                        isNullable: false,
                        default: false,
                    },
                    ...commonFields,
                ],
            }),
            true,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable(tableName, true);
    }

}
