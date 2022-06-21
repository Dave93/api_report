import {Body, Controller, Get, Query, ValidationPipe} from '@nestjs/common';
import * as fs from 'fs'
import {Client} from '@elastic/elasticsearch';
import {CurrentUser, Permissions, SkipAuth, TOKEN_NAME} from '@auth';
import {
    ApiBearerAuth,
    ApiInternalServerErrorResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {ConfigService} from "@nestjs/config";
import {Terminal} from "@modules/terminals/terminals_entity";
import {CreateUserRequestDto} from '@admin/access/users/dtos';
import {ReportPeriodRequestDto} from '@modules/terminals/dtos/ReportPeriodRequestDto';
import {UserEntity} from '@admin/access/users/user.entity';
import {DateTime} from 'luxon';
import currency from 'currency.js'
import {TerminalToggleRequestDto} from '@modules/terminals/dtos/TerminalToggleRequestDto';

const esb = require('elastic-builder');
let xlsx = require('json-as-xlsx');
const ExcelJS = require('exceljs');

// @SkipAuth()
@ApiTags('Terminals')
@ApiBearerAuth(TOKEN_NAME)
@Controller({
    path: 'terminals',
    version: '1',
})
export class TerminalsController {
    static elasticUser: string;
    static elasticPassword: string;
    static elasticCertFile: string;

    constructor(private configService: ConfigService) {
        TerminalsController.elasticUser = this.configService.get('ELASTIC_USERNAME');
        TerminalsController.elasticPassword = this.configService.get('ELASTIC_PASSWORD');
        TerminalsController.elasticCertFile = this.configService.get('ELASTIC_CERTFILE');
    }

    @ApiOperation({description: 'Terminals list'})
    @ApiOkResponse({description: 'Successfully list of terminals'})
    @ApiUnauthorizedResponse({description: 'Invalid credentials'})
    @ApiInternalServerErrorResponse({description: 'Server error'})
    @Get()
    async getTerminals() {
        const client = new Client({
            node: 'https://localhost:9200',
            auth: {
                username: TerminalsController.elasticUser,
                password: TerminalsController.elasticPassword
            },
            caFingerprint: "E0:2B:03:49:5C:B4:E6:ED:DE:D8:5C:24:ED:60:3E:9F:7B:9E:B7:49:28:04:BD:6C:8E:6F:14:B0:B4:BA:D2:C0",
            ssl: {
                rejectUnauthorized: false
            }
        });


        const requestBody = esb
            .requestBodySearch()
            .size(90);

        try {
            let result: Terminal[] = [];
            let res = await client
                .search({
                    index: 'candyterminals',
                    body: requestBody.toJSON()
                });
            // console.log(res.body.hits.hits);
            result = [...res.body.hits.hits.map((item) => ({
                id: item._id,
                ...item._source
            }))];
            res = await client
                .search({
                    index: 'lesterminals',
                    body: requestBody.toJSON()
                });
            // console.log(res.body.hits.hits);
            result = [...result, ...res.body.hits.hits.map((item) => ({
                id: item._id,
                ...item._source
            }))];
            return result;
        } catch (e) {
            return [];
        }

    }


    @ApiOperation({description: 'Terminal Payment report'})
    @ApiOkResponse({description: 'Successfully printed report'})
    @ApiUnauthorizedResponse({description: 'Invalid credentials'})
    @ApiInternalServerErrorResponse({description: 'Server error'})
    @Permissions('report.paysystems')
    @Get('/payment_report')
    async getPaymentReport(@Query() ReportPeriod: ReportPeriodRequestDto, @CurrentUser() user: UserEntity,) {
        let dateFrom = DateTime.fromMillis(parseInt(ReportPeriod.dateFrom), {zone: 'utc'}).toFormat("yyyy-MM-dd'T'HH:mm:ss") + '.000Z';
        let dateTo = DateTime.fromMillis(parseInt(ReportPeriod.dateTo), {zone: 'utc'}).toFormat("yyyy-MM-dd'T'HH:mm:ss") + '.000Z';

        const client = new Client({
            node: 'https://localhost:9200',
            auth: {
                username: TerminalsController.elasticUser,
                password: TerminalsController.elasticPassword
            },
            caFingerprint: "E0:2B:03:49:5C:B4:E6:ED:DE:D8:5C:24:ED:60:3E:9F:7B:9E:B7:49:28:04:BD:6C:8E:6F:14:B0:B4:BA:D2:C0",
            ssl: {
                rejectUnauthorized: false
            }
        });
        let result = [];
        try {
            let res = await client
                .search({
                    index: 'candy_orders',
                    body: {
                        "size": 9000,
                        "query": {
                            "bool": {
                                "must": [],
                                "filter": [
                                    {
                                        "bool": {
                                            "should": [
                                                {
                                                    "match_phrase": {
                                                        "terminalData.terminal_id.keyword": user.iiko_terminal_id
                                                    }
                                                }
                                            ],
                                            "minimum_should_match": 1
                                        }
                                    },
                                    {
                                        "range": {
                                            "created_at": {
                                                "format": "strict_date_optional_time",
                                                "gte": dateFrom,
                                                "lte": dateTo
                                            }
                                        }
                                    },
                                    {
                                        "bool": {
                                            "should": [
                                                {
                                                    "match_phrase": {
                                                        "paymentType": "click"
                                                    }
                                                },
                                                {
                                                    "match_phrase": {
                                                        "paymentType": "payme"
                                                    }
                                                }
                                            ],
                                            "minimum_should_match": 1
                                        }
                                    }
                                ],
                                "should": [],
                                "must_not": []
                            }
                        }
                    }
                });
            result = [...res.body.hits.hits.map(hit => ({
                id: hit._id,
                ...hit._source
            }))];
            res = await client
                .search({
                    index: 'les_orders',
                    body: {
                        "size": 9000,
                        "query": {
                            "bool": {
                                "must": [],
                                "filter": [
                                    {
                                        "bool": {
                                            "should": [
                                                {
                                                    "match_phrase": {
                                                        "terminalData.terminal_id.keyword": user.iiko_terminal_id
                                                    }
                                                }
                                            ],
                                            "minimum_should_match": 1
                                        }
                                    },
                                    {
                                        "range": {
                                            "created_at": {
                                                "format": "strict_date_optional_time",
                                                "gte": dateFrom,
                                                "lte": dateTo
                                            }
                                        }
                                    },
                                    {
                                        "bool": {
                                            "should": [
                                                {
                                                    "match_phrase": {
                                                        "paymentType": "click"
                                                    }
                                                },
                                                {
                                                    "match_phrase": {
                                                        "paymentType": "payme"
                                                    }
                                                }
                                            ],
                                            "minimum_should_match": 1
                                        }
                                    }

                                ],
                                "should": [],
                                "must_not": []
                            }
                        }
                    }
                });


            result = [...result, ...res.body.hits.hits.map(hit => ({
                id: hit._id,
                ...hit._source
            }))];

            let filterPhones = [
                '+998712026500',
                '+998711507277'
            ];

            let paymeResult = [...result].filter(item => item.paymentType.toLowerCase() === 'payme' && !filterPhones.includes(item.user.phone) && item.status !== 'cancelled');
            let expressPaymeResult = [...result].filter(item => item.paymentType.toLowerCase() === 'payme' && item.user.phone === '+998712026500');
            let bringoPaymeResult = [...result].filter(item => item.paymentType.toLowerCase() === 'payme' && item.user.phone === '+998711507277');
            let paymeCancelledResult = [...result].filter(item => item.paymentType.toLowerCase() === 'payme' && !filterPhones.includes(item.user.phone) && item.status === 'cancelled');
            let clickResult = [...result].filter(item => item.paymentType.toLowerCase() === 'click' && !filterPhones.includes(item.user.phone) && item.status !== 'cancelled');
            let expressClickResult = [...result].filter(item => item.paymentType.toLowerCase() === 'click' && item.user.phone === '+998712026500');
            let bringoClickResult = [...result].filter(item => item.paymentType.toLowerCase() === 'click' && item.user.phone === '+998711507277');
            let clickCancelledResult = [...result].filter(item => item.paymentType.toLowerCase() === 'click' && !filterPhones.includes(item.user.phone) && item.status === 'cancelled');

            const workbook = new ExcelJS.Workbook();

            const sheet = workbook.addWorksheet('Отчёт по оплатам');

            let rowIndex = 1;

            if (paymeResult.length) {

                // paymeResult
                sheet.addRow(['Заказы с бота, сайта, колл-центра, приложения']);
                rowIndex++;
                const paymeResultTable = sheet.addTable({
                    name: 'Payme_Result',
                    ref: `A${rowIndex}`,
                    headerRow: true,
                    totalsRow: true,
                    style: {
                        theme: 'TableStyleMedium2',
                        showRowStripes: true,
                    },
                    columns: [
                        {name: 'Дата', totalsRowLabel: '', filterButton: true},
                        {name: 'Филиал', totalsRowLabel: '', filterButton: false},
                        {name: 'Телефон', totalsRowLabel: '', filterButton: true},
                        {name: 'Сумма заказа', totalsRowFunction: 'sum', filterButton: false},
                        {name: 'Номер заказа', totalsRowLabel: '', filterButton: true},
                        {name: 'Статус', totalsRowLabel: '', filterButton: true},
                        {name: 'Платёжная система', totalsRowLabel: '', filterButton: false},
                    ],
                    rows: [...paymeResult.map(row => [
                        DateTime.fromISO(row.created_at).toFormat('dd.MM.yyyy HH:mm:ss'),
                        row.terminalData.name,
                        row.user.phone,
                        new Intl.NumberFormat('ru-RU').format(row.order_total),
                        row.id,
                        row.status,
                        row.paymentType
                    ])],
                });
                // await paymeResultTable.commit();
                rowIndex++;
                rowIndex++;
                sheet.addRow({}).commit();
                rowIndex += paymeResult.length;
            }


            if (expressPaymeResult.length) {

                // expressPaymeResult
                rowIndex++;
                sheet.addRow(['Заказы Express24']);
                rowIndex++;
                const expressPaymeResultTable = sheet.addTable({
                    name: 'Express_PaymeResult',
                    ref: `A${rowIndex}`,
                    headerRow: true,
                    totalsRow: true,
                    style: {
                        theme: 'TableStyleMedium2',
                        showRowStripes: true,
                    },
                    columns: [
                        {name: 'Дата', totalsRowLabel: '', filterButton: true},
                        {name: 'Филиал', totalsRowLabel: '', filterButton: false},
                        {name: 'Телефон', totalsRowLabel: '', filterButton: true},
                        {name: 'Сумма заказа', totalsRowFunction: 'sum', filterButton: false},
                        {name: 'Номер заказа', totalsRowLabel: '', filterButton: true},
                        {name: 'Статус', totalsRowLabel: '', filterButton: true},
                        {name: 'Платёжная система', totalsRowLabel: '', filterButton: false},
                    ],
                    rows: [...expressPaymeResult.map(row => [
                        DateTime.fromISO(row.created_at).toFormat('dd.MM.yyyy HH:mm:ss'),
                        row.terminalData.name,
                        row.user.phone,
                        new Intl.NumberFormat('ru-RU').format(row.order_total),
                        row.id,
                        row.status,
                        row.paymentType
                    ])],
                });

                // await expressPaymeResultTable.commit();
                rowIndex++;
                rowIndex++;
                sheet.addRow({}).commit();
                rowIndex += expressPaymeResult.length;
            }

            if (bringoPaymeResult.length) {

                // bringoPaymeResult
                rowIndex++;
                sheet.addRow(['Заказы Bringo']);
                rowIndex++;
                const bringoPaymeResultTable = sheet.addTable({
                    name: 'Bringo_Payme_Result',
                    ref: `A${rowIndex}`,
                    headerRow: true,
                    totalsRow: true,
                    style: {
                        theme: 'TableStyleMedium2',
                        showRowStripes: true,
                    },
                    columns: [
                        {name: 'Дата', totalsRowLabel: '', filterButton: true},
                        {name: 'Филиал', totalsRowLabel: '', filterButton: false},
                        {name: 'Телефон', totalsRowLabel: '', filterButton: true},
                        {name: 'Сумма заказа', totalsRowFunction: 'sum', filterButton: false},
                        {name: 'Номер заказа', totalsRowLabel: '', filterButton: true},
                        {name: 'Статус', totalsRowLabel: '', filterButton: true},
                        {name: 'Платёжная система', totalsRowLabel: '', filterButton: false},
                    ],
                    rows: [...bringoPaymeResult.map(row => [
                        DateTime.fromISO(row.created_at).toFormat('dd.MM.yyyy HH:mm:ss'),
                        row.terminalData.name,
                        row.user.phone,
                        new Intl.NumberFormat('ru-RU').format(row.order_total),
                        row.id,
                        row.status,
                        row.paymentType
                    ])],
                });

                // await bringoPaymeResultTable.commit();
                rowIndex++;
                rowIndex++;
                sheet.addRow({}).commit();
                rowIndex += bringoPaymeResult.length;
            }


            if (paymeCancelledResult.length) {

                // paymeCancelledResult
                rowIndex++;
                sheet.addRow(['Отменённые заказы']);
                rowIndex++;
                const paymeCancelledResultTable = sheet.addTable({
                    name: 'Payme_Cancelled_Result',
                    ref: `A${rowIndex}`,
                    headerRow: true,
                    totalsRow: true,
                    style: {
                        theme: 'TableStyleMedium2',
                        showRowStripes: true,
                    },
                    columns: [
                        {name: 'Дата', totalsRowLabel: '', filterButton: true},
                        {name: 'Филиал', totalsRowLabel: '', filterButton: false},
                        {name: 'Телефон', totalsRowLabel: '', filterButton: true},
                        {name: 'Сумма заказа', totalsRowFunction: 'sum', filterButton: false},
                        {name: 'Номер заказа', totalsRowLabel: '', filterButton: true},
                        {name: 'Статус', totalsRowLabel: '', filterButton: true},
                        {name: 'Платёжная система', totalsRowLabel: '', filterButton: false},
                    ],
                    rows: [...paymeCancelledResult.map(row => [
                        DateTime.fromISO(row.created_at).toFormat('dd.MM.yyyy HH:mm:ss'),
                        row.terminalData.name,
                        row.user.phone,
                        new Intl.NumberFormat('ru-RU').format(row.order_total),
                        row.id,
                        row.status,
                        row.paymentType
                    ])],
                });

                // await paymeCancelledResultTable.commit();
                rowIndex++;
                rowIndex++;
                sheet.addRow({}).commit();
                rowIndex += paymeCancelledResult.length;
            }

            if (clickResult.length) {

                // clickResult
                rowIndex++;
                sheet.addRow(['Заказы с бота, сайта, колл-центра, приложения']);
                rowIndex++;
                const clickResultTable = sheet.addTable({
                    name: 'Click_Result',
                    ref: `A${rowIndex}`,
                    headerRow: true,
                    totalsRow: true,
                    style: {
                        theme: 'TableStyleMedium2',
                        showRowStripes: true,
                    },
                    columns: [
                        {name: 'Дата', totalsRowLabel: '', filterButton: true},
                        {name: 'Филиал', totalsRowLabel: '', filterButton: false},
                        {name: 'Телефон', totalsRowLabel: '', filterButton: true},
                        {name: 'Сумма заказа', totalsRowFunction: 'sum', filterButton: false},
                        {name: 'Номер заказа', totalsRowLabel: '', filterButton: true},
                        {name: 'Статус', totalsRowLabel: '', filterButton: true},
                        {name: 'Платёжная система', totalsRowLabel: '', filterButton: false},
                    ],
                    rows: [...clickResult.map(row => [
                        DateTime.fromISO(row.created_at).toFormat('dd.MM.yyyy HH:mm:ss'),
                        row.terminalData.name,
                        row.user.phone,
                        new Intl.NumberFormat('ru-RU').format(row.order_total),
                        row.id,
                        row.status,
                        row.paymentType
                    ])],
                });

                // await clickResultTable.commit();
                rowIndex++;
                rowIndex++;
                sheet.addRow({}).commit();
                rowIndex += clickResult.length;
            }


            if (expressClickResult.length) {

                // expressClickResult
                rowIndex++;
                sheet.addRow([
                    'Заказы Express24'
                ]);
                rowIndex++;
                const expressClickResultTable = sheet.addTable({
                    name: 'Express_Click_Result',
                    ref: `A${rowIndex}`,
                    headerRow: true,
                    totalsRow: true,
                    style: {
                        theme: 'TableStyleMedium2',
                        showRowStripes: true,
                    },
                    columns: [
                        {name: 'Дата', totalsRowLabel: '', filterButton: true},
                        {name: 'Филиал', totalsRowLabel: '', filterButton: false},
                        {name: 'Телефон', totalsRowLabel: '', filterButton: true},
                        {name: 'Сумма заказа', totalsRowFunction: 'sum', filterButton: false},
                        {name: 'Номер заказа', totalsRowLabel: '', filterButton: true},
                        {name: 'Статус', totalsRowLabel: '', filterButton: true},
                        {name: 'Платёжная система', totalsRowLabel: '', filterButton: false},
                    ],
                    rows: [...expressClickResult.map(row => [
                        DateTime.fromISO(row.created_at).toFormat('dd.MM.yyyy HH:mm:ss'),
                        row.terminalData.name,
                        row.user.phone,
                        new Intl.NumberFormat('ru-RU').format(row.order_total),
                        row.id,
                        row.status,
                        row.paymentType
                    ])],
                });

                // await expressClickResultTable.commit();
                rowIndex++;
                rowIndex++;
                sheet.addRow({}).commit();
                rowIndex += expressClickResult.length;
            }


            if (bringoClickResult.length) {

                // bringoClickResult
                rowIndex++;
                sheet.addRow([
                    'Заказы Bringo'
                ]);
                rowIndex++;
                const bringoClickResultTable = sheet.addTable({
                    name: 'Bringo_Click_Result',
                    ref: `A${rowIndex}`,
                    headerRow: true,
                    totalsRow: true,
                    style: {
                        theme: 'TableStyleMedium2',
                        showRowStripes: true,
                    },
                    columns: [
                        {name: 'Дата', totalsRowLabel: '', filterButton: true},
                        {name: 'Филиал', totalsRowLabel: '', filterButton: false},
                        {name: 'Телефон', totalsRowLabel: '', filterButton: true},
                        {name: 'Сумма заказа', totalsRowFunction: 'sum', filterButton: false},
                        {name: 'Номер заказа', totalsRowLabel: '', filterButton: true},
                        {name: 'Статус', totalsRowLabel: '', filterButton: true},
                        {name: 'Платёжная система', totalsRowLabel: '', filterButton: false},
                    ],
                    rows: [...bringoClickResult.map(row => [
                        DateTime.fromISO(row.created_at).toFormat('dd.MM.yyyy HH:mm:ss'),
                        row.terminalData.name,
                        row.user.phone,
                        new Intl.NumberFormat('ru-RU').format(row.order_total),
                        row.id,
                        row.status,
                        row.paymentType
                    ])],
                });

                // await bringoClickResultTable.commit();
                rowIndex++;
                rowIndex++;
                sheet.addRow({}).commit();
                rowIndex += bringoClickResult.length;
            }


            if (clickCancelledResult.length) {

                // clickCancelledResult
                rowIndex++;
                sheet.addRow([
                    'Отменённые заказы'
                ]);
                rowIndex++;
                const clickCancelledResultTable = sheet.addTable({
                    name: 'Click_Cancelled_Result',
                    ref: `A${rowIndex}`,
                    headerRow: true,
                    totalsRow: true,
                    style: {
                        theme: 'TableStyleMedium2',
                        showRowStripes: true,
                    },
                    columns: [
                        {name: 'Дата', totalsRowLabel: '', filterButton: true},
                        {name: 'Филиал', totalsRowLabel: '', filterButton: false},
                        {name: 'Телефон', totalsRowLabel: '', filterButton: true},
                        {name: 'Сумма заказа', totalsRowFunction: 'sum', filterButton: false},
                        {name: 'Номер заказа', totalsRowLabel: '', filterButton: true},
                        {name: 'Статус', totalsRowLabel: '', filterButton: true},
                        {name: 'Платёжная система', totalsRowLabel: '', filterButton: false},
                    ],
                    rows: [...clickCancelledResult.map(row => [
                        DateTime.fromISO(row.created_at).toFormat('dd.MM.yyyy HH:mm:ss'),
                        row.terminalData.name,
                        row.user.phone,
                        new Intl.NumberFormat('ru-RU').format(row.order_total),
                        row.id,
                        row.status,
                        row.paymentType
                    ])],
                });

                // await clickCancelledResultTable.commit();
                rowIndex++;
                rowIndex++;
                sheet.addRow({}).commit();
                rowIndex += clickCancelledResult.length;
            }


            this.autoWidth(sheet);

            // sheet.commit();
            // await workbook.commit();
            const buffer = await workbook.xlsx.writeBuffer();
            return buffer.toString('base64');
        } catch (err) {
            console.log(err)
        }
    }


    autoWidth(worksheet, minimalWidth = 10) {
        if (worksheet.columns) {

            worksheet.columns.forEach((column) => {
                let maxColumnLength = 0;
                column.eachCell({includeEmpty: true}, (cell) => {
                    maxColumnLength = Math.max(
                        maxColumnLength,
                        minimalWidth,
                        cell.value ? cell.value.toString().length : 0
                    );
                });
                column.width = maxColumnLength + 2;
            });
        }
    };

    @Get('/toggle_terminal')
    async toggleTerminal(@Query() active: TerminalToggleRequestDto, @CurrentUser() user: UserEntity) {
        const client = new Client({
            node: 'https://localhost:9200',
            auth: {
                username: TerminalsController.elasticUser,
                password: TerminalsController.elasticPassword
            },
            caFingerprint: "E0:2B:03:49:5C:B4:E6:ED:DE:D8:5C:24:ED:60:3E:9F:7B:9E:B7:49:28:04:BD:6C:8E:6F:14:B0:B4:BA:D2:C0",
            ssl: {
                rejectUnauthorized: false
            }
        });

        try {


            let res = await client
                .search({
                    index: 'candyterminals',
                    body: {
                        "size": 9000,
                        "query": {
                            "bool": {
                                "must": [],
                                "filter": [
                                    {
                                        "match_phrase": {
                                            "terminal_id": user.iiko_terminal_id
                                        }
                                    }
                                ],
                                "should": [],
                                "must_not": []
                            }
                        }
                    }
                });

            if (res.body.hits.hits.length) {
                let currentTerminal = res.body.hits.hits[0];
                await client.update({
                    index: 'candyterminals',
                    id: currentTerminal._id,
                    body: {
                        doc: {
                            active: !!+active.active
                        }
                    }
                })
            }
            res = await client
                .search({
                    index: 'lesterminals',
                    body: {
                        "size": 9000,
                        "query": {
                            "bool": {
                                "must": [],
                                "filter": [
                                    {
                                        "match_phrase": {
                                            "terminal_id": user.iiko_terminal_id
                                        }
                                    }
                                ],
                                "should": [],
                                "must_not": []
                            }
                        }
                    }
                });

            if (res.body.hits.hits.length) {
                let currentLesTerminal = res.body.hits.hits[0];
                await client.update({
                    index: 'lesterminals',
                    id: currentLesTerminal._id,
                    body: {
                        doc: {
                            active: !!+active.active
                        }
                    }
                })
            }
        } catch (e) {
            console.log(e)
        }
    }
}

