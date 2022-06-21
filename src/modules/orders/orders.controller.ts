import {Body, Controller, Get, Post, Query} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiInternalServerErrorResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse
} from "@nestjs/swagger";
import {CurrentUser, Permissions, TOKEN_NAME} from "@auth";
import {ConfigService} from "@nestjs/config";
import {ReportPeriodRequestDto} from "@modules/terminals/dtos/ReportPeriodRequestDto";
import {UserEntity} from "@admin/access/users/user.entity";
import {Client} from "@elastic/elasticsearch";
import {DateTime} from 'luxon';
import {TerminalToggleOperatorRequestDto} from '@modules/terminals/dtos/TerminalToggleOperatorRequestDto';
import axios from 'axios';
import * as fs from 'fs'


@ApiTags('Orders')
@ApiBearerAuth(TOKEN_NAME)
@Controller({
    path: 'orders',
    version: '1',
})
export class OrdersController {
    static elasticUser: string;
    static elasticPassword: string;
    static elasticCertFile: string;

    constructor(private configService: ConfigService) {
        OrdersController.elasticUser = this.configService.get('ELASTIC_USERNAME');
        OrdersController.elasticPassword = this.configService.get('ELASTIC_PASSWORD');
        OrdersController.elasticCertFile = this.configService.get('ELASTIC_CERTFILE');
    }

    @ApiOperation({description: 'Delivery count'})
    @ApiOkResponse({description: 'Successfully delivery count'})
    @ApiUnauthorizedResponse({description: 'Invalid credentials'})
    @ApiInternalServerErrorResponse({description: 'Server error'})
    @Permissions('report.paysystems')
    @Get('delivery_count')
    async getDeliveryCount(@Query() ReportPeriod: ReportPeriodRequestDto, @CurrentUser() user: UserEntity,) {
        let dateFrom = ReportPeriod.dateFrom;
        let dateTo = ReportPeriod.dateTo;

        const client = new Client({
            node: 'https://localhost:9200',
            auth: {
                username: OrdersController.elasticUser,
                password: OrdersController.elasticPassword
            },
            caFingerprint: "E0:2B:03:49:5C:B4:E6:ED:DE:D8:5C:24:ED:60:3E:9F:7B:9E:B7:49:28:04:BD:6C:8E:6F:14:B0:B4:BA:D2:C0",
            ssl: {
                rejectUnauthorized: false
            }
        });
        try {
            let result = 0;
            let body = {
                size: 0,
                query: {
                    "bool": {
                        "must": [],
                        "filter": [
                            {
                                bool: {}
                            },
                            {
                                "match_phrase": {
                                    "delivery_type": "deliver"
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
                            }
                        ],
                        "should": [],
                        "must_not": [
                            {
                                "bool": {
                                    "should": [
                                        {
                                            "match_phrase": {
                                                "status": "awaiting-payment"
                                            }
                                        },
                                        {
                                            "match_phrase": {
                                                "status": "cancelled"
                                            }
                                        },
                                        {
                                            "match_phrase": {
                                                "status": "not-accepted"
                                            }
                                        },
                                        {
                                            "match_phrase": {
                                                "status": "not-confirmed"
                                            }
                                        }
                                    ],
                                    "minimum_should_match": 1
                                }
                            }
                        ]
                    }
                }
            };
            if (ReportPeriod.terminal) {
                body.query.bool.filter[0].bool = {
                    "should": [
                        {
                            "match_phrase": {
                                "terminalData.name": ReportPeriod.terminal
                            }
                        }
                    ],
                    "minimum_should_match": 1
                };
            }
            let project = user.project ? user.project : ReportPeriod.project;
            if (project) {
                let res = await client
                    .search({
                        index: project == 'chopar' ? 'candy_orders' : 'les_orders',
                        body
                    });
                result += res.body.hits.total.value;
            } else {
                let res = await client
                    .search({
                        index: 'candy_orders',
                        body
                    });
                result += res.body.hits.total.value;
                res = await client
                    .search({
                        index: 'les_orders',
                        body
                    });
                result += res.body.hits.total.value;
            }

            return result;
        } catch (e) {

        }
    }

    @ApiOperation({description: 'Delivery total price'})
    @ApiOkResponse({description: 'Successfully delivery total price'})
    @ApiUnauthorizedResponse({description: 'Invalid credentials'})
    @ApiInternalServerErrorResponse({description: 'Server error'})
    @Permissions('report.paysystems')
    @Get('delivery_total_price')
    async getDeliveryTotalPrice(@Query() ReportPeriod: ReportPeriodRequestDto, @CurrentUser() user: UserEntity,) {
        let dateFrom = ReportPeriod.dateFrom;
        let dateTo = ReportPeriod.dateTo;

        const client = new Client({
            node: 'https://localhost:9200',
            auth: {
                username: OrdersController.elasticUser,
                password: OrdersController.elasticPassword
            },
            caFingerprint: "E0:2B:03:49:5C:B4:E6:ED:DE:D8:5C:24:ED:60:3E:9F:7B:9E:B7:49:28:04:BD:6C:8E:6F:14:B0:B4:BA:D2:C0",
            ssl: {
                rejectUnauthorized: false
            }
        });
        try {
            let body = {
                "aggs": {
                    "0": {
                        "sum": {
                            "field": "order_total"
                        }
                    }
                },
                "size": 0,
                "fields": [
                    {
                        "field": "created_at",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_cookingStartTime",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenBillPrinted",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenClosed",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenConfirmed",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenCreated",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenDelivered",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenPrinted",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenSended",
                        "format": "date_time"
                    },
                    {
                        "field": "updated_at",
                        "format": "date_time"
                    },
                    {
                        "field": "user.created_at",
                        "format": "date_time"
                    }
                ],
                "script_fields": {
                    "testCookingTime": {
                        "script": {
                            "source": "if (doc['iiko_cookingStartTime'].size() == 0) return null;\r\nif (doc['iiko_whenBillPrinted'].size() == 0) return null;\r\ndef cookingStartTime = doc[\"iiko_cookingStartTime\"].value;\r\ndef whenPrinted = doc[\"iiko_whenBillPrinted\"].value;\r\n\r\nif (cookingStartTime != null) {\r\n    def difference = (whenPrinted.toEpochMilli()-cookingStartTime.toEpochMilli());\r\n    return difference/1000;\r\n}",
                            "lang": "painless"
                        }
                    }
                },
                "stored_fields": [
                    "*"
                ],
                "runtime_mappings": {},
                "_source": {
                    "excludes": []
                },
                "query": {
                    "bool": {
                        "must": [],
                        "filter": [
                            {
                                "bool": {}
                            },
                            {
                                "match_phrase": {
                                    "delivery_type": "deliver"
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
                            }
                        ],
                        "should": [],
                        "must_not": [
                            {
                                "bool": {
                                    "should": [
                                        {
                                            "match_phrase": {
                                                "status": "awaiting-payment"
                                            }
                                        },
                                        {
                                            "match_phrase": {
                                                "status": "cancelled"
                                            }
                                        },
                                        {
                                            "match_phrase": {
                                                "status": "not-accepted"
                                            }
                                        },
                                        {
                                            "match_phrase": {
                                                "status": "not-confirmed"
                                            }
                                        }
                                    ],
                                    "minimum_should_match": 1
                                }
                            }
                        ]
                    }
                }
            };

            if (ReportPeriod.terminal) {
                body.query.bool.filter[0].bool = {
                    "should": [
                        {
                            "match_phrase": {
                                "terminalData.name": ReportPeriod.terminal
                            }
                        }
                    ],
                    "minimum_should_match": 1
                };
            }
            let result = 0;
            let project = user.project ? user.project : ReportPeriod.project;
            if (project) {
                let res = await client
                    .search({
                        index: project == 'chopar' ? 'candy_orders' : 'les_orders',
                        body
                    });


                result += res.body.aggregations[0].value;
            } else {

                let res = await client
                    .search({
                        index: 'candy_orders',
                        body
                    });


                result += res.body.aggregations[0].value;
                res = await client
                    .search({
                        index: 'les_orders',
                        body
                    });

                result += res.body.aggregations[0].value;
            }
            return result;
        } catch (e) {

        }

    }
    @ApiOperation({description: 'Delivery items'})
    @ApiOkResponse({description: 'Successfully delivery items'})
    @ApiUnauthorizedResponse({description: 'Invalid credentials'})
    @ApiInternalServerErrorResponse({description: 'Server error'})
    @Permissions('report.paysystems')
    @Get('delivery_items')
    async getDeliveryItems(@Query() ReportPeriod: ReportPeriodRequestDto, @CurrentUser() user: UserEntity,) {
        let dateFrom = ReportPeriod.dateFrom;
        let dateTo = ReportPeriod.dateTo;


        const client = new Client({
            node: 'https://localhost:9200',
            auth: {
                username: OrdersController.elasticUser,
                password: OrdersController.elasticPassword
            },
            caFingerprint: "E0:2B:03:49:5C:B4:E6:ED:DE:D8:5C:24:ED:60:3E:9F:7B:9E:B7:49:28:04:BD:6C:8E:6F:14:B0:B4:BA:D2:C0",
            ssl: {
                rejectUnauthorized: false
            }
        });
        try {

            let body = {
                "size": 3000,
                "sort": [
                    {
                        "created_at": {
                            "order": "asc",
                            "unmapped_type": "boolean"
                        }
                    }
                ],
                "query": {
                    "bool": {
                        "must": [],
                        "filter": [
                            {
                                "bool": {}
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
                                "match_phrase": {
                                    "delivery_type": "deliver"
                                }
                            }
                        ],
                        "should": [],
                        "must_not": [
                            {
                                "bool": {
                                    "should": [
                                        {
                                            "match_phrase": {
                                                "status": "awaiting-payment"
                                            }
                                        },
                                        {
                                            "match_phrase": {
                                                "status": "cancelled"
                                            }
                                        },
                                        {
                                            "match_phrase": {
                                                "status": "not-accepted"
                                            }
                                        },
                                        {
                                            "match_phrase": {
                                                "status": "not-confirmed"
                                            }
                                        }
                                    ],
                                    "minimum_should_match": 1
                                }
                            }
                        ]
                    }
                }
            };
            if (ReportPeriod.terminal) {
                body.query.bool.filter[0].bool =
                    {
                        "should": [
                            {
                                "match_phrase": {
                                    "terminalData.name": ReportPeriod.terminal
                                }
                            }
                        ],
                        "minimum_should_match": 1
                    }

            }
            let result = [];
            let project = user.project ? user.project : ReportPeriod.project;
            if (project) {

                let res = await client
                    .search({
                        index: project == 'chopar' ? 'candy_orders' : 'les_orders',
                        body
                    });


                result = res.body.hits.hits.map(item => ({
                    id: item._id,
                    ...item._source
                }));
            } else {


                let res = await client
                    .search({
                        index: 'candy_orders',
                        body
                    });


                result = res.body.hits.hits.map(item => ({
                    id: item._id,
                    ...item._source
                }));

                res = await client
                    .search({
                        index: 'les_orders',
                        body
                    });

                result = [...result, ...res.body.hits.hits.map(item => ({
                    id: item._id,
                    ...item._source
                }))];
            }
            return result;
        } catch (e) {

        }

    }

    @ApiOperation({description: 'Pickup count'})
    @ApiOkResponse({description: 'Successfully pickup count'})
    @ApiUnauthorizedResponse({description: 'Invalid credentials'})
    @ApiInternalServerErrorResponse({description: 'Server error'})
    @Permissions('report.paysystems')
    @Get('pickup_count')
    async getPickupCount(@Query() ReportPeriod: ReportPeriodRequestDto, @CurrentUser() user: UserEntity,) {
        let dateFrom = ReportPeriod.dateFrom;
        let dateTo = ReportPeriod.dateTo;


        const client = new Client({
            node: 'https://localhost:9200',
            auth: {
                username: OrdersController.elasticUser,
                password: OrdersController.elasticPassword
            },
            caFingerprint: "E0:2B:03:49:5C:B4:E6:ED:DE:D8:5C:24:ED:60:3E:9F:7B:9E:B7:49:28:04:BD:6C:8E:6F:14:B0:B4:BA:D2:C0",
            ssl: {
                rejectUnauthorized: false
            }
        });
        try {
            let result = 0;

            let body = {
                size: 0,
                query: {
                    "bool": {
                        "must": [],
                        "filter": [
                            {
                                "bool": {}
                            },
                            {
                                "match_phrase": {
                                    "delivery_type": "pickup"
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
                            }
                        ],
                        "should": [],
                        "must_not": [
                            {
                                "bool": {
                                    "should": [
                                        {
                                            "match_phrase": {
                                                "status": "awaiting-payment"
                                            }
                                        },
                                        {
                                            "match_phrase": {
                                                "status": "cancelled"
                                            }
                                        },
                                        {
                                            "match_phrase": {
                                                "status": "not-accepted"
                                            }
                                        },
                                        {
                                            "match_phrase": {
                                                "status": "not-confirmed"
                                            }
                                        }
                                    ],
                                    "minimum_should_match": 1
                                }
                            }
                        ]
                    }
                }
            };
            if (ReportPeriod.terminal) {
                body.query.bool.filter[0].bool =
                    {

                        "should": [
                            {
                                "match_phrase": {
                                    "terminalData.name": ReportPeriod.terminal
                                }
                            }
                        ],
                        "minimum_should_match": 1
                    }

            }
            let project = user.project ? user.project : ReportPeriod.project;
            if (project) {
                let res = await client
                    .search({
                        index: project == 'chopar' ? 'candy_orders' : 'les_orders',
                        body
                    });
                if (typeof res.body.hits.total !== 'number') {
                    result += res.body.hits.total.value;
                }
            } else {
                let res = await client
                    .search({
                        index: 'candy_orders',
                        body
                    });
                if (typeof res.body.hits.total !== 'number') {
                    result += res.body.hits.total.value;
                }
                res = await client
                    .search({
                        index: 'les_orders',
                        body
                    });
                if (typeof res.body.hits.total !== 'number') {
                    result += res.body.hits.total.value;
                }
            }
            return result;
        } catch (e) {

        }
    }

    @ApiOperation({description: 'Pickup total price'})
    @ApiOkResponse({description: 'Successfully pickup total price'})
    @ApiUnauthorizedResponse({description: 'Invalid credentials'})
    @ApiInternalServerErrorResponse({description: 'Server error'})
    @Permissions('report.paysystems')
    @Get('pickup_total_price')
    async getPickupTotalPrice(@Query() ReportPeriod: ReportPeriodRequestDto, @CurrentUser() user: UserEntity,) {
        let dateFrom = ReportPeriod.dateFrom;
        let dateTo = ReportPeriod.dateTo;


        const client = new Client({
            node: 'https://localhost:9200',
            auth: {
                username: OrdersController.elasticUser,
                password: OrdersController.elasticPassword
            },
            caFingerprint: "E0:2B:03:49:5C:B4:E6:ED:DE:D8:5C:24:ED:60:3E:9F:7B:9E:B7:49:28:04:BD:6C:8E:6F:14:B0:B4:BA:D2:C0",
            ssl: {
                rejectUnauthorized: false
            }
        });
        try {
            let body = {
                "aggs": {
                    "0": {
                        "sum": {
                            "field": "order_total"
                        }
                    }
                },
                "size": 0,
                "fields": [
                    {
                        "field": "created_at",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_cookingStartTime",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenBillPrinted",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenClosed",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenConfirmed",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenCreated",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenDelivered",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenPrinted",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenSended",
                        "format": "date_time"
                    },
                    {
                        "field": "updated_at",
                        "format": "date_time"
                    },
                    {
                        "field": "user.created_at",
                        "format": "date_time"
                    }
                ],
                "script_fields": {
                    "testCookingTime": {
                        "script": {
                            "source": "if (doc['iiko_cookingStartTime'].size() == 0) return null;\r\nif (doc['iiko_whenBillPrinted'].size() == 0) return null;\r\ndef cookingStartTime = doc[\"iiko_cookingStartTime\"].value;\r\ndef whenPrinted = doc[\"iiko_whenBillPrinted\"].value;\r\n\r\nif (cookingStartTime != null) {\r\n    def difference = (whenPrinted.toEpochMilli()-cookingStartTime.toEpochMilli());\r\n    return difference/1000;\r\n}",
                            "lang": "painless"
                        }
                    }
                },
                "stored_fields": [
                    "*"
                ],
                "runtime_mappings": {},
                "_source": {
                    "excludes": []
                },
                "query": {
                    "bool": {
                        "must": [],
                        "filter": [
                            {
                                "bool": {}
                            },
                            {
                                "match_phrase": {
                                    "delivery_type": "pickup"
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
                            }
                        ],
                        "should": [],
                        "must_not": [
                            {
                                "bool": {
                                    "should": [
                                        {
                                            "match_phrase": {
                                                "status": "awaiting-payment"
                                            }
                                        },
                                        {
                                            "match_phrase": {
                                                "status": "cancelled"
                                            }
                                        },
                                        {
                                            "match_phrase": {
                                                "status": "not-accepted"
                                            }
                                        },
                                        {
                                            "match_phrase": {
                                                "status": "not-confirmed"
                                            }
                                        }
                                    ],
                                    "minimum_should_match": 1
                                }
                            }
                        ]
                    }
                }
            };
            if (ReportPeriod.terminal) {
                body.query.bool.filter[0].bool =
                    {
                        "should": [
                            {
                                "match_phrase": {
                                    "terminalData.name": ReportPeriod.terminal
                                }
                            }
                        ],
                        "minimum_should_match": 1
                    }
            }
            let result = 0;
            let project = user.project ? user.project : ReportPeriod.project;
            if (project) {
                let res = await client
                    .search({
                        index: project == 'chopar' ? 'candy_orders' : 'les_orders',
                        body
                    });


                result += res.body.aggregations[0].value;
            } else {
                let res = await client
                    .search({
                        index: 'candy_orders',
                        body
                    });


                result += res.body.aggregations[0].value;
                res = await client
                    .search({
                        index: 'les_orders',
                        body
                    });

                result += res.body.aggregations[0].value;
            }
            return result;
        } catch (e) {

        }

    }

    @ApiOperation({description: 'Pickup items'})
    @ApiOkResponse({description: 'Successfully pickup items'})
    @ApiUnauthorizedResponse({description: 'Invalid credentials'})
    @ApiInternalServerErrorResponse({description: 'Server error'})
    @Permissions('report.paysystems')
    @Get('pickup_items')
    async getPickupItems(@Query() ReportPeriod: ReportPeriodRequestDto, @CurrentUser() user: UserEntity,) {
        let dateFrom = ReportPeriod.dateFrom;
        let dateTo = ReportPeriod.dateTo;


        const client = new Client({
            node: 'https://localhost:9200',
            auth: {
                username: OrdersController.elasticUser,
                password: OrdersController.elasticPassword
            },
            caFingerprint: "E0:2B:03:49:5C:B4:E6:ED:DE:D8:5C:24:ED:60:3E:9F:7B:9E:B7:49:28:04:BD:6C:8E:6F:14:B0:B4:BA:D2:C0",
            ssl: {
                rejectUnauthorized: false
            }
        });
        try {
            let body = {
                "size": 3000,
                "sort": [
                    {
                        "created_at": {
                            "order": "asc",
                            "unmapped_type": "boolean"
                        }
                    }
                ],
                "query": {
                    "bool": {
                        "must": [],
                        "filter": [
                            {
                                "bool": {}
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
                                "match_phrase": {
                                    "delivery_type": "pickup"
                                }
                            }
                        ],
                        "should": [],
                        "must_not": [
                            {
                                "bool": {
                                    "should": [
                                        {
                                            "match_phrase": {
                                                "status": "awaiting-payment"
                                            }
                                        },
                                        {
                                            "match_phrase": {
                                                "status": "cancelled"
                                            }
                                        },
                                        {
                                            "match_phrase": {
                                                "status": "not-accepted"
                                            }
                                        },
                                        {
                                            "match_phrase": {
                                                "status": "not-confirmed"
                                            }
                                        }
                                    ],
                                    "minimum_should_match": 1
                                }
                            }
                        ]
                    }
                }
            };
            if (ReportPeriod.terminal) {
                body.query.bool.filter[0].bool =
                    {
                        "should": [
                            {
                                "match_phrase": {
                                    "terminalData.name": ReportPeriod.terminal
                                }
                            }
                        ],
                        "minimum_should_match": 1
                    }
            }
            let result = [];
            let project = user.project ? user.project : ReportPeriod.project;
            if (project) {

                let res = await client
                    .search({
                        index: project == 'chopar' ? 'candy_orders' : 'les_orders',
                        body
                    });

                result = res.body.hits.hits.map(item => ({
                    id: item._id,
                    ...item._source
                }));
            } else {

                let res = await client
                    .search({
                        index: 'candy_orders',
                        body
                    });

                result = res.body.hits.hits.map(item => ({
                    id: item._id,
                    ...item._source
                }));

                res = await client
                    .search({
                        index: 'les_orders',
                        body
                    });

                result = [...result, ...res.body.hits.hits.map(item => ({
                    id: item._id,
                    ...item._source
                }))];
            }
            return result;
        } catch (e) {

        }

    }


    @ApiOperation({description: 'Pickup count'})
    @ApiOkResponse({description: 'Successfully pickup count'})
    @ApiUnauthorizedResponse({description: 'Invalid credentials'})
    @ApiInternalServerErrorResponse({description: 'Server error'})
    @Permissions('report.paysystems')
    @Get('payme_count')
    async getPaymeCount(@Query() ReportPeriod: ReportPeriodRequestDto, @CurrentUser() user: UserEntity,) {
        let dateFrom = ReportPeriod.dateFrom;
        let dateTo = ReportPeriod.dateTo;


        const client = new Client({
            node: 'https://localhost:9200',
            auth: {
                username: OrdersController.elasticUser,
                password: OrdersController.elasticPassword
            },
            caFingerprint: "E0:2B:03:49:5C:B4:E6:ED:DE:D8:5C:24:ED:60:3E:9F:7B:9E:B7:49:28:04:BD:6C:8E:6F:14:B0:B4:BA:D2:C0",
            ssl: {
                rejectUnauthorized: false
            }
        });
        try {
            let result = 0;

            let body = {
                size: 0,
                query: {
                    "bool": {
                        "must": [],
                        "filter": [
                            {
                                "bool": {}
                            },
                            {
                                "match_phrase": {
                                    "paymentType": "payme"
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
                            }
                        ],
                        "should": [],
                        "must_not": [
                            {
                                "bool": {
                                    "should": [
                                        {
                                            "match_phrase": {
                                                "status": "awaiting-payment"
                                            }
                                        },
                                        {
                                            "match_phrase": {
                                                "status": "cancelled"
                                            }
                                        },
                                        {
                                            "match_phrase": {
                                                "status": "not-accepted"
                                            }
                                        },
                                        {
                                            "match_phrase": {
                                                "status": "not-confirmed"
                                            }
                                        }
                                    ],
                                    "minimum_should_match": 1
                                }
                            }
                        ]
                    }
                }
            };
            if (ReportPeriod.terminal) {
                body.query.bool.filter[0].bool =
                    {
                        "should": [
                            {
                                "match_phrase": {
                                    "terminalData.name": ReportPeriod.terminal
                                }
                            }
                        ],
                        "minimum_should_match": 1
                    }
            }
            let project = user.project ? user.project : ReportPeriod.project;
            if (project) {
                let res = await client
                    .search({
                        index: project == 'chopar' ? 'candy_orders' : 'les_orders',
                        body
                    });
                if (typeof res.body.hits.total !== 'number') {
                    result += res.body.hits.total.value;
                }
            } else {
                let res = await client
                    .search({
                        index: 'candy_orders',
                        body
                    });
                if (typeof res.body.hits.total !== 'number') {
                    result += res.body.hits.total.value;
                }
                res = await client
                    .search({
                        index: 'les_orders',
                        body
                    });
                if (typeof res.body.hits.total !== 'number') {
                    result += res.body.hits.total.value;
                }
            }
            return result;
        } catch (e) {

        }
    }

    @ApiOperation({description: 'Pickup total price'})
    @ApiOkResponse({description: 'Successfully pickup total price'})
    @ApiUnauthorizedResponse({description: 'Invalid credentials'})
    @ApiInternalServerErrorResponse({description: 'Server error'})
    @Permissions('report.paysystems')
    @Get('payme_total_price')
    async getPaymeTotalPrice(@Query() ReportPeriod: ReportPeriodRequestDto, @CurrentUser() user: UserEntity,) {
        let dateFrom = ReportPeriod.dateFrom;
        let dateTo = ReportPeriod.dateTo;
        const client = new Client({
            node: 'https://localhost:9200',
            auth: {
                username: OrdersController.elasticUser,
                password: OrdersController.elasticPassword
            },
            caFingerprint: "E0:2B:03:49:5C:B4:E6:ED:DE:D8:5C:24:ED:60:3E:9F:7B:9E:B7:49:28:04:BD:6C:8E:6F:14:B0:B4:BA:D2:C0",
            ssl: {
                rejectUnauthorized: false
            }
        });
        try {
            let body = {
                "aggs": {
                    "0": {
                        "sum": {
                            "field": "order_total"
                        }
                    }
                },
                "size": 0,
                "fields": [
                    {
                        "field": "created_at",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_cookingStartTime",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenBillPrinted",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenClosed",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenConfirmed",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenCreated",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenDelivered",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenPrinted",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenSended",
                        "format": "date_time"
                    },
                    {
                        "field": "updated_at",
                        "format": "date_time"
                    },
                    {
                        "field": "user.created_at",
                        "format": "date_time"
                    }
                ],
                "script_fields": {
                    "testCookingTime": {
                        "script": {
                            "source": "if (doc['iiko_cookingStartTime'].size() == 0) return null;\r\nif (doc['iiko_whenBillPrinted'].size() == 0) return null;\r\ndef cookingStartTime = doc[\"iiko_cookingStartTime\"].value;\r\ndef whenPrinted = doc[\"iiko_whenBillPrinted\"].value;\r\n\r\nif (cookingStartTime != null) {\r\n    def difference = (whenPrinted.toEpochMilli()-cookingStartTime.toEpochMilli());\r\n    return difference/1000;\r\n}",
                            "lang": "painless"
                        }
                    }
                },
                "stored_fields": [
                    "*"
                ],
                "runtime_mappings": {},
                "_source": {
                    "excludes": []
                },
                "query": {
                    "bool": {
                        "must": [],
                        "filter": [
                            {
                                "bool": {}
                            },
                            {
                                "match_phrase": {
                                    "paymentType": "payme"
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
                            }
                        ],
                        "should": [],
                        "must_not": [
                            {
                                "bool": {
                                    "should": [
                                        {
                                            "match_phrase": {
                                                "status": "awaiting-payment"
                                            }
                                        },
                                        {
                                            "match_phrase": {
                                                "status": "cancelled"
                                            }
                                        },
                                        {
                                            "match_phrase": {
                                                "status": "not-accepted"
                                            }
                                        },
                                        {
                                            "match_phrase": {
                                                "status": "not-confirmed"
                                            }
                                        }
                                    ],
                                    "minimum_should_match": 1
                                }
                            }
                        ]
                    }
                }
            };
            if (ReportPeriod.terminal) {
                body.query.bool.filter[0].bool =
                    {
                        "should": [
                            {
                                "match_phrase": {
                                    "terminalData.name": ReportPeriod.terminal
                                }
                            }
                        ],
                        "minimum_should_match": 1
                    }
            }
            let result = 0;
            let project = user.project ? user.project : ReportPeriod.project;
            if (project) {
                let res = await client
                    .search({
                        index: project == 'chopar' ? 'candy_orders' : 'les_orders',
                        body
                    });


                result += res.body.aggregations[0].value;
            } else {
                let res = await client
                    .search({
                        index: 'candy_orders',
                        body
                    });


                result += res.body.aggregations[0].value;
                res = await client
                    .search({
                        index: 'les_orders',
                        body
                    });

                result += res.body.aggregations[0].value;
            }
            return result;
        } catch (e) {

        }

    }


    @ApiOperation({description: 'Payme report'})
    @ApiOkResponse({description: 'Successfully printed report'})
    @ApiUnauthorizedResponse({description: 'Invalid credentials'})
    @ApiInternalServerErrorResponse({description: 'Server error'})
    @Permissions('report.paysystems')
    @Get('payme_report')
    async getPaymeReport(@Query() ReportPeriod: ReportPeriodRequestDto, @CurrentUser() user: UserEntity,) {
        let dateFrom = ReportPeriod.dateFrom;
        let dateTo = ReportPeriod.dateTo;

        const client = new Client({
            node: 'https://localhost:9200',
            auth: {
                username: OrdersController.elasticUser,
                password: OrdersController.elasticPassword
            },
            caFingerprint: "E0:2B:03:49:5C:B4:E6:ED:DE:D8:5C:24:ED:60:3E:9F:7B:9E:B7:49:28:04:BD:6C:8E:6F:14:B0:B4:BA:D2:C0",
            ssl: {
                rejectUnauthorized: false
            }
        });
        let result = [];
        try {
            let body = {
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
                                                "terminalData.name": ReportPeriod.terminal
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
            };
            if (!ReportPeriod.terminal) {
                body.query.bool.filter = body.query.bool.filter.filter((element, index) => index > 0)
            }
            let project = user.project ? user.project : ReportPeriod.project;
            if (project) {
                let res = await client
                    .search({
                        index: project == 'chopar' ? 'candy_orders' : 'les_orders',
                        body
                    });

                result = [...res.body.hits.hits.map(hit => ({
                    id: hit._id,
                    ...hit._source
                }))];
            } else {

                let res = await client
                    .search({
                        index: 'candy_orders',
                        body
                    });
                result = [...res.body.hits.hits.map(hit => ({
                    id: hit._id,
                    ...hit._source
                }))];


                res = await client
                    .search({
                        index: 'les_orders',
                        body
                    });

                result = [...result, ...res.body.hits.hits.map(hit => ({
                    id: hit._id,
                    ...hit._source
                }))];
            }

            let filterPhones = [
                '+998712026500',
                '+998711507277'
            ];

            let paymeResult = [...result].filter(item => item.paymentType.toLowerCase() === 'payme' && !filterPhones.includes(item.user.phone) && item.status !== 'cancelled');
            let expressPaymeResult = [...result].filter(item => item.paymentType.toLowerCase() === 'payme' && item.user.phone === '+998712026500');
            let bringoPaymeResult = [...result].filter(item => item.paymentType.toLowerCase() === 'payme' && item.user.phone === '+998711507277');
            let paymeCancelledResult = [...result].filter(item => item.paymentType.toLowerCase() === 'payme' && !filterPhones.includes(item.user.phone) && item.status === 'cancelled');


            return {
                paymeResult,
                expressPaymeResult,
                bringoPaymeResult,
                paymeCancelledResult
            }
        } catch (err) {
            console.log(err)
        }
    }

    @ApiOperation({description: 'Click count'})
    @ApiOkResponse({description: 'Successfully Click count'})
    @ApiUnauthorizedResponse({description: 'Invalid credentials'})
    @ApiInternalServerErrorResponse({description: 'Server error'})
    @Permissions('report.paysystems')
    @Get('click_count')
    async getClickCount(@Query() ReportPeriod: ReportPeriodRequestDto, @CurrentUser() user: UserEntity,) {
        let dateFrom = ReportPeriod.dateFrom;
        let dateTo = ReportPeriod.dateTo;


        const client = new Client({
            node: 'https://localhost:9200',
            auth: {
                username: OrdersController.elasticUser,
                password: OrdersController.elasticPassword
            },
            caFingerprint: "E0:2B:03:49:5C:B4:E6:ED:DE:D8:5C:24:ED:60:3E:9F:7B:9E:B7:49:28:04:BD:6C:8E:6F:14:B0:B4:BA:D2:C0",
            ssl: {
                rejectUnauthorized: false
            }
        });
        try {
            let result = 0;
            let body = {
                size: 0,
                query: {
                    "bool": {
                        "must": [],
                        "filter": [
                            {
                                "bool": {
                                    "should": [
                                        {
                                            "match_phrase": {
                                                "terminalData.name": ReportPeriod.terminal
                                            }
                                        }
                                    ],
                                    "minimum_should_match": 1
                                }
                            },
                            {
                                "match_phrase": {
                                    "paymentType": "click"
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
                            }
                        ],
                        "should": [],
                        "must_not": [
                            {
                                "bool": {
                                    "should": [
                                        {
                                            "match_phrase": {
                                                "status": "awaiting-payment"
                                            }
                                        },
                                        {
                                            "match_phrase": {
                                                "status": "cancelled"
                                            }
                                        },
                                        {
                                            "match_phrase": {
                                                "status": "not-accepted"
                                            }
                                        },
                                        {
                                            "match_phrase": {
                                                "status": "not-confirmed"
                                            }
                                        }
                                    ],
                                    "minimum_should_match": 1
                                }
                            }
                        ]
                    }
                }
            };
            if (!ReportPeriod.terminal) {
                body.query.bool.filter = body.query.bool.filter.filter((element, index) => index > 0)
            }
            let project = user.project ? user.project : ReportPeriod.project;
            if (project) {
                let res = await client
                    .search({
                        index: project == 'chopar' ? 'candy_orders' : 'les_orders',
                        body
                    });
                result += res.body.hits.total.value;
            } else {

                let res = await client
                    .search({
                        index: 'candy_orders',
                        body
                    });
                result += res.body.hits.total.value;
                res = await client
                    .search({
                        index: 'les_orders',
                        body
                    });
                result += res.body.hits.total.value;
            }
            return result;
        } catch (e) {

        }
    }

    @ApiOperation({description: 'Click total price'})
    @ApiOkResponse({description: 'Successfully click total price'})
    @ApiUnauthorizedResponse({description: 'Invalid credentials'})
    @ApiInternalServerErrorResponse({description: 'Server error'})
    @Permissions('report.paysystems')
    @Get('click_total_price')
    async getClickTotalPrice(@Query() ReportPeriod: ReportPeriodRequestDto, @CurrentUser() user: UserEntity,) {
        let dateFrom = ReportPeriod.dateFrom;
        let dateTo = ReportPeriod.dateTo;


        const client = new Client({
            node: 'https://localhost:9200',
            auth: {
                username: OrdersController.elasticUser,
                password: OrdersController.elasticPassword
            },
            caFingerprint: "E0:2B:03:49:5C:B4:E6:ED:DE:D8:5C:24:ED:60:3E:9F:7B:9E:B7:49:28:04:BD:6C:8E:6F:14:B0:B4:BA:D2:C0",
            ssl: {
                rejectUnauthorized: false
            }
        });
        try {
            let body = {
                "aggs": {
                    "0": {
                        "sum": {
                            "field": "order_total"
                        }
                    }
                },
                "size": 0,
                "fields": [
                    {
                        "field": "created_at",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_cookingStartTime",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenBillPrinted",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenClosed",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenConfirmed",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenCreated",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenDelivered",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenPrinted",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenSended",
                        "format": "date_time"
                    },
                    {
                        "field": "updated_at",
                        "format": "date_time"
                    },
                    {
                        "field": "user.created_at",
                        "format": "date_time"
                    }
                ],
                "script_fields": {
                    "testCookingTime": {
                        "script": {
                            "source": "if (doc['iiko_cookingStartTime'].size() == 0) return null;\r\nif (doc['iiko_whenBillPrinted'].size() == 0) return null;\r\ndef cookingStartTime = doc[\"iiko_cookingStartTime\"].value;\r\ndef whenPrinted = doc[\"iiko_whenBillPrinted\"].value;\r\n\r\nif (cookingStartTime != null) {\r\n    def difference = (whenPrinted.toEpochMilli()-cookingStartTime.toEpochMilli());\r\n    return difference/1000;\r\n}",
                            "lang": "painless"
                        }
                    }
                },
                "stored_fields": [
                    "*"
                ],
                "runtime_mappings": {},
                "_source": {
                    "excludes": []
                },
                "query": {
                    "bool": {
                        "must": [],
                        "filter": [
                            {
                                "bool": {
                                    "should": [
                                        {
                                            "match_phrase": {
                                                "terminalData.name": ReportPeriod.terminal
                                            }
                                        }
                                    ],
                                    "minimum_should_match": 1
                                }
                            },
                            {
                                "match_phrase": {
                                    "paymentType": "click"
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
                            }
                        ],
                        "should": [],
                        "must_not": [
                            {
                                "bool": {
                                    "should": [
                                        {
                                            "match_phrase": {
                                                "status": "awaiting-payment"
                                            }
                                        },
                                        {
                                            "match_phrase": {
                                                "status": "cancelled"
                                            }
                                        },
                                        {
                                            "match_phrase": {
                                                "status": "not-accepted"
                                            }
                                        },
                                        {
                                            "match_phrase": {
                                                "status": "not-confirmed"
                                            }
                                        }
                                    ],
                                    "minimum_should_match": 1
                                }
                            }
                        ]
                    }
                }
            };
            if (!ReportPeriod.terminal) {
                body.query.bool.filter = body.query.bool.filter.filter((element, index) => index > 0)
            }
            let result = 0;
            let project = user.project ? user.project : ReportPeriod.project;
            if (project) {
                let res = await client
                    .search({
                        index: project == 'chopar' ? 'candy_orders' : 'les_orders',
                        body
                    });

                result += res.body.aggregations[0].value;
            } else {

                let res = await client
                    .search({
                        index: 'candy_orders',
                        body
                    });

                result += res.body.aggregations[0].value;
                res = await client
                    .search({
                        index: 'les_orders',
                        body
                    });
                result += res.body.aggregations[0].value;
            }
            return result;
        } catch (e) {

        }

    }

    @ApiOperation({description: 'Click report'})
    @ApiOkResponse({description: 'Successfully printed report'})
    @ApiUnauthorizedResponse({description: 'Invalid credentials'})
    @ApiInternalServerErrorResponse({description: 'Server error'})
    @Permissions('report.paysystems')
    @Get('click_report')
    async getClickReport(@Query() ReportPeriod: ReportPeriodRequestDto, @CurrentUser() user: UserEntity,) {
        let dateFrom = ReportPeriod.dateFrom;
        let dateTo = ReportPeriod.dateTo;

        const client = new Client({
            node: 'https://localhost:9200',
            auth: {
                username: OrdersController.elasticUser,
                password: OrdersController.elasticPassword
            },
            caFingerprint: "E0:2B:03:49:5C:B4:E6:ED:DE:D8:5C:24:ED:60:3E:9F:7B:9E:B7:49:28:04:BD:6C:8E:6F:14:B0:B4:BA:D2:C0",
            ssl: {
                rejectUnauthorized: false
            }
        });
        let result = [];
        try {
            let body = {
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
                                                "terminalData.name": ReportPeriod.terminal
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
            };
            if (!ReportPeriod.terminal) {
                body.query.bool.filter = body.query.bool.filter.filter((element, index) => index > 0)
            }
            let project = user.project ? user.project : ReportPeriod.project;
            if (project) {
                let res = await client
                    .search({
                        index: project == 'chopar' ? 'candy_orders' : 'les_orders',
                        body
                    });
                result = [...res.body.hits.hits.map(hit => ({
                    id: hit._id,
                    ...hit._source
                }))];
            } else {

                let res = await client
                    .search({
                        index: 'candy_orders',
                        body
                    });
                result = [...res.body.hits.hits.map(hit => ({
                    id: hit._id,
                    ...hit._source
                }))];
                res = await client
                    .search({
                        index: 'les_orders',
                        body
                    });

                result = [...result, ...res.body.hits.hits.map(hit => ({
                    id: hit._id,
                    ...hit._source
                }))];
            }

            let filterPhones = [
                '+998712026500',
                '+998711507277'
            ];

            let clickResult = [...result].filter(item => item.paymentType.toLowerCase() === 'click' && !filterPhones.includes(item.user.phone) && item.status !== 'cancelled');
            let expressClickResult = [...result].filter(item => item.paymentType.toLowerCase() === 'click' && item.user.phone === '+998712026500');
            let bringoClickResult = [...result].filter(item => item.paymentType.toLowerCase() === 'click' && item.user.phone === '+998711507277');
            let clickCancelledResult = [...result].filter(item => item.paymentType.toLowerCase() === 'click' && !filterPhones.includes(item.user.phone) && item.status === 'cancelled');


            return {
                clickResult,
                expressClickResult,
                bringoClickResult,
                clickCancelledResult
            }
        } catch (err) {
            console.log(err)
        }
    }

    @ApiOperation({description: 'Cashback count'})
    @ApiOkResponse({description: 'Successfully cashback count'})
    @ApiUnauthorizedResponse({description: 'Invalid credentials'})
    @ApiInternalServerErrorResponse({description: 'Server error'})
    @Permissions('report.paysystems')
    @Get('cashback_count')
    async getCashbackCount(@Query() ReportPeriod: ReportPeriodRequestDto, @CurrentUser() user: UserEntity,) {
        let dateFrom = ReportPeriod.dateFrom;
        let dateTo = ReportPeriod.dateTo;


        const client = new Client({
            node: 'https://localhost:9200',
            auth: {
                username: OrdersController.elasticUser,
                password: OrdersController.elasticPassword
            },
            caFingerprint: "E0:2B:03:49:5C:B4:E6:ED:DE:D8:5C:24:ED:60:3E:9F:7B:9E:B7:49:28:04:BD:6C:8E:6F:14:B0:B4:BA:D2:C0",
            ssl: {
                rejectUnauthorized: false
            }
        });
        try {
            let result = 0;

            let body = {
                size: 0,
                query: {
                    "bool": {
                        "must": [],
                        "filter": [
                            {
                                "bool": {
                                    "should": [
                                        {
                                            "match_phrase": {
                                                "terminalData.name": ReportPeriod.terminal
                                            }
                                        }
                                    ],
                                    "minimum_should_match": 1
                                }
                            },
                            {
                                "match_phrase": {
                                    "paymentType": "cashback"
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
                            }
                        ],
                        "should": [],
                        "must_not": [
                            {
                                "bool": {
                                    "should": [
                                        {
                                            "match_phrase": {
                                                "status": "awaiting-payment"
                                            }
                                        },
                                        {
                                            "match_phrase": {
                                                "status": "cancelled"
                                            }
                                        },
                                        {
                                            "match_phrase": {
                                                "status": "not-accepted"
                                            }
                                        },
                                        {
                                            "match_phrase": {
                                                "status": "not-confirmed"
                                            }
                                        }
                                    ],
                                    "minimum_should_match": 1
                                }
                            }
                        ]
                    }
                }
            };
            if (!ReportPeriod.terminal) {
                body.query.bool.filter = body.query.bool.filter.filter((element, index) => index > 0)
            }
            let project = user.project ? user.project : ReportPeriod.project;
            if (project) {
                let res = await client
                    .search({
                        index: project == 'chopar' ? 'candy_orders' : 'les_orders',
                        body
                    });
                result += res.body.hits.total.value;
            } else {

                let res = await client
                    .search({
                        index: 'candy_orders',
                        body
                    });
                result += res.body.hits.total.value;
                res = await client
                    .search({
                        index: 'les_orders',
                        body
                    });
                result += res.body.hits.total.value;
            }
            return result;
        } catch (e) {

        }
    }

    @ApiOperation({description: 'Cashback total price'})
    @ApiOkResponse({description: 'Successfully cashback total price'})
    @ApiUnauthorizedResponse({description: 'Invalid credentials'})
    @ApiInternalServerErrorResponse({description: 'Server error'})
    @Permissions('report.paysystems')
    @Get('cashback_total_price')
    async getCashbackTotalPrice(@Query() ReportPeriod: ReportPeriodRequestDto, @CurrentUser() user: UserEntity,) {
        let dateFrom = ReportPeriod.dateFrom;
        let dateTo = ReportPeriod.dateTo;


        const client = new Client({
            node: 'https://localhost:9200',
            auth: {
                username: OrdersController.elasticUser,
                password: OrdersController.elasticPassword
            },
            caFingerprint: "E0:2B:03:49:5C:B4:E6:ED:DE:D8:5C:24:ED:60:3E:9F:7B:9E:B7:49:28:04:BD:6C:8E:6F:14:B0:B4:BA:D2:C0",
            ssl: {
                rejectUnauthorized: false
            }
        });
        try {
            let body = {
                "aggs": {
                    "0": {
                        "sum": {
                            "field": "order_total"
                        }
                    }
                },
                "size": 0,
                "fields": [
                    {
                        "field": "created_at",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_cookingStartTime",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenBillPrinted",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenClosed",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenConfirmed",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenCreated",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenDelivered",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenPrinted",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenSended",
                        "format": "date_time"
                    },
                    {
                        "field": "updated_at",
                        "format": "date_time"
                    },
                    {
                        "field": "user.created_at",
                        "format": "date_time"
                    }
                ],
                "script_fields": {
                    "testCookingTime": {
                        "script": {
                            "source": "if (doc['iiko_cookingStartTime'].size() == 0) return null;\r\nif (doc['iiko_whenBillPrinted'].size() == 0) return null;\r\ndef cookingStartTime = doc[\"iiko_cookingStartTime\"].value;\r\ndef whenPrinted = doc[\"iiko_whenBillPrinted\"].value;\r\n\r\nif (cookingStartTime != null) {\r\n    def difference = (whenPrinted.toEpochMilli()-cookingStartTime.toEpochMilli());\r\n    return difference/1000;\r\n}",
                            "lang": "painless"
                        }
                    }
                },
                "stored_fields": [
                    "*"
                ],
                "runtime_mappings": {},
                "_source": {
                    "excludes": []
                },
                "query": {
                    "bool": {
                        "must": [],
                        "filter": [
                            {
                                "bool": {
                                    "should": [
                                        {
                                            "match_phrase": {
                                                "terminalData.name": ReportPeriod.terminal
                                            }
                                        }
                                    ],
                                    "minimum_should_match": 1
                                }
                            },
                            {
                                "match_phrase": {
                                    "paymentType": "cashback"
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
                            }
                        ],
                        "should": [],
                        "must_not": [
                            {
                                "bool": {
                                    "should": [
                                        {
                                            "match_phrase": {
                                                "status": "awaiting-payment"
                                            }
                                        },
                                        {
                                            "match_phrase": {
                                                "status": "cancelled"
                                            }
                                        },
                                        {
                                            "match_phrase": {
                                                "status": "not-accepted"
                                            }
                                        },
                                        {
                                            "match_phrase": {
                                                "status": "not-confirmed"
                                            }
                                        }
                                    ],
                                    "minimum_should_match": 1
                                }
                            }
                        ]
                    }
                }
            };
            if (!ReportPeriod.terminal) {
                body.query.bool.filter = body.query.bool.filter.filter((element, index) => index > 0)
            }
            let result = 0;
            let project = user.project ? user.project : ReportPeriod.project;
            if (project) {
                let res = await client
                    .search({
                        index: project == 'chopar' ? 'candy_orders' : 'les_orders',
                        body
                    });

                result += res.body.aggregations[0].value;
            } else {

                let res = await client
                    .search({
                        index: 'candy_orders',
                        body
                    });

                result += res.body.aggregations[0].value;
                res = await client
                    .search({
                        index: 'les_orders',
                        body
                    });
                result += res.body.aggregations[0].value;
            }
            return result;
        } catch (e) {

        }

    }

    @ApiOperation({description: 'Cashback report'})
    @ApiOkResponse({description: 'Successfully printed Cashback'})
    @ApiUnauthorizedResponse({description: 'Invalid credentials'})
    @ApiInternalServerErrorResponse({description: 'Server error'})
    @Permissions('report.paysystems')
    @Get('cashback_report')
    async getCashbackReport(@Query() ReportPeriod: ReportPeriodRequestDto, @CurrentUser() user: UserEntity,) {
        let dateFrom = ReportPeriod.dateFrom;
        let dateTo = ReportPeriod.dateTo;

        const client = new Client({
            node: 'https://localhost:9200',
            auth: {
                username: OrdersController.elasticUser,
                password: OrdersController.elasticPassword
            },
            caFingerprint: "E0:2B:03:49:5C:B4:E6:ED:DE:D8:5C:24:ED:60:3E:9F:7B:9E:B7:49:28:04:BD:6C:8E:6F:14:B0:B4:BA:D2:C0",
            ssl: {
                rejectUnauthorized: false
            }
        });
        let result = [];
        try {
            let body = {
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
                                                "terminalData.name": ReportPeriod.terminal
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
                                                "paymentType": "cashback"
                                            }
                                        },
                                    ],
                                    "minimum_should_match": 1
                                }
                            }

                        ],
                        "should": [],
                        "must_not": []
                    }
                }
            };
            if (!ReportPeriod.terminal) {
                body.query.bool.filter = body.query.bool.filter.filter((element, index) => index > 0)
            }
            let project = user.project ? user.project : ReportPeriod.project;
            if (project) {
                let res = await client
                    .search({
                        index: project == 'chopar' ? 'candy_orders' : 'les_orders',
                        body
                    });
                result = [...res.body.hits.hits.map(hit => ({
                    id: hit._id,
                    ...hit._source
                }))];
            } else {

                let res = await client
                    .search({
                        index: 'candy_orders',
                        body
                    });
                result = [...res.body.hits.hits.map(hit => ({
                    id: hit._id,
                    ...hit._source
                }))];
                res = await client
                    .search({
                        index: 'les_orders',
                        body
                    });

                result = [...result, ...res.body.hits.hits.map(hit => ({
                    id: hit._id,
                    ...hit._source
                }))];
            }

            return {
                result
            }
        } catch (err) {
            console.log(err)
        }
    }


    @ApiOperation({description: 'Cashback report'})
    @ApiOkResponse({description: 'Successfully printed Cashback'})
    @ApiUnauthorizedResponse({description: 'Invalid credentials'})
    @ApiInternalServerErrorResponse({description: 'Server error'})
    @Permissions('report.paysystems')
    @Get('callcenter/order_counts')
    async getCallCenterOrderCounts(@Query() ReportPeriod: ReportPeriodRequestDto, @CurrentUser() user: UserEntity,) {
        let dateFrom = ReportPeriod.dateFrom;
        let dateTo = ReportPeriod.dateTo;

        const client = new Client({
            node: 'https://localhost:9200',
            auth: {
                username: OrdersController.elasticUser,
                password: OrdersController.elasticPassword
            },
            caFingerprint: "E0:2B:03:49:5C:B4:E6:ED:DE:D8:5C:24:ED:60:3E:9F:7B:9E:B7:49:28:04:BD:6C:8E:6F:14:B0:B4:BA:D2:C0",
            ssl: {
                rejectUnauthorized: false
            }
        });
        let choparPeriodResult = [];
        let choparPeriodOrderUsers = [];
        let choparPeriodUsers = [];
        let choparTotalPeriodOrderUsers = [];
        let lesPeriodResult = [];
        let lesPeriodOrderUsers = [];
        let lesPeriodUsers = [];
        let lesTotalPeriodOrderUsers = [];
        let totalPeriodResult = [];
        let choparMonthResult = [];
        let lesMonthResult = [];
        let totalMonthResult = [];
        try {
            let body = {
                "aggs": {
                    "0": {
                        "date_histogram": {
                            "field": "created_at",
                            "calendar_interval": "1d",
                            "time_zone": "Asia/Tashkent"
                        },
                        "aggs": {
                            "1": {
                                "terms": {
                                    "field": "sourceType",
                                    "order": {
                                        "_count": "desc"
                                    },
                                    "size": 5
                                }
                            }
                        }
                    }
                },
                "size": 0,
                "fields": [
                    {
                        "field": "created_at",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_cookingStartTime",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenBillPrinted",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenClosed",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenConfirmed",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenCreated",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenDelivered",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenPrinted",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenSended",
                        "format": "date_time"
                    },
                    {
                        "field": "updated_at",
                        "format": "date_time"
                    },
                    {
                        "field": "user.created_at",
                        "format": "date_time"
                    }
                ],
                "script_fields": {
                    "testCookingTime": {
                        "script": {
                            "source": "if (doc['iiko_cookingStartTime'].size() == 0) return null;\r\nif (doc['iiko_whenBillPrinted'].size() == 0) return null;\r\ndef cookingStartTime = doc[\"iiko_cookingStartTime\"].value;\r\ndef whenPrinted = doc[\"iiko_whenBillPrinted\"].value;\r\n\r\nif (cookingStartTime != null) {\r\n    def difference = (whenPrinted.toEpochMilli()-cookingStartTime.toEpochMilli());\r\n    return difference/1000;\r\n}",
                            "lang": "painless"
                        }
                    }
                },
                "stored_fields": [
                    "*"
                ],
                "runtime_mappings": {},
                "_source": {
                    "excludes": []
                },
                "query": {
                    "bool": {
                        "must": [],
                        "filter": [
                            {
                                "range": {
                                    "created_at": {
                                        "format": "strict_date_optional_time",
                                        "gte": dateFrom,
                                        "lte": dateTo
                                    }
                                }
                            }
                        ],
                        "should": [],
                        "must_not": [
                            {
                                "bool": {
                                    "should": [
                                        {
                                            "match_phrase": {
                                                "status": "cancelled"
                                            }
                                        },
                                        {
                                            "match_phrase": {
                                                "status": "not-accepted"
                                            }
                                        },
                                        {
                                            "match_phrase": {
                                                "status": "not-confirmed"
                                            }
                                        },
                                        {
                                            "match_phrase": {
                                                "status": "awaiting-payment"
                                            }
                                        }
                                    ],
                                    "minimum_should_match": 1
                                }
                            }
                        ]
                    }
                }
            };

            let res = await client
                .search({
                    index: 'candy_orders',
                    body
                });
            // console.log(res.body.aggregations[0]);
            choparPeriodResult = res.body.aggregations[0].buckets;


            let choparPeriodOrderUsersBody = {
                "aggs": {
                    "0": {
                        "terms": {
                            "field": "sourceType",
                            "order": {
                                "2": "desc"
                            },
                            "size": 6
                        },
                        "aggs": {
                            "1": {
                                "date_histogram": {
                                    "field": "created_at",
                                    "calendar_interval": "1d",
                                    "time_zone": "Asia/Tashkent"
                                },
                                "aggs": {
                                    "2": {
                                        "cardinality": {
                                            "field": "user_id"
                                        }
                                    }
                                }
                            },
                            "2": {
                                "cardinality": {
                                    "field": "user_id"
                                }
                            }
                        }
                    }
                },
                "size": 0,
                "fields": [
                    {
                        "field": "created_at",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_cookingStartTime",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenBillPrinted",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenClosed",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenConfirmed",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenCreated",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenDelivered",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenPrinted",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenSended",
                        "format": "date_time"
                    },
                    {
                        "field": "updated_at",
                        "format": "date_time"
                    },
                    {
                        "field": "user.created_at",
                        "format": "date_time"
                    }
                ],
                "script_fields": {},
                "stored_fields": [
                    "*"
                ],
                "runtime_mappings": {},
                "_source": {
                    "excludes": []
                },
                "query": {
                    "bool": {
                        "must": [],
                        "filter": [
                            {
                                "range": {
                                    "created_at": {
                                        "format": "strict_date_optional_time",
                                        "gte": dateFrom,
                                        "lte": dateTo
                                    }
                                }
                            }
                        ],
                        "should": [],
                        "must_not": []
                    }
                }
            };
            let resPeriodOrderUsersBody = await client
                .search({
                    index: 'candy_orders',
                    body: choparPeriodOrderUsersBody
                });

            choparPeriodOrderUsers = resPeriodOrderUsersBody.body.aggregations[0].buckets;

            let resLesPeriodOrderUsersBody = await client
                .search({
                    index: 'les_orders',
                    body: choparPeriodOrderUsersBody
                });

            lesPeriodOrderUsers = resLesPeriodOrderUsersBody.body.aggregations[0].buckets;

            let choparPeriodUsersBody = {
                "aggs": {
                    "0": {
                        "date_histogram": {
                            "field": "created_at",
                            "calendar_interval": "1d",
                            "time_zone": "Asia/Tashkent"
                        },
                        "aggs": {
                            "1": {
                                "terms": {
                                    "field": "source_type",
                                    "order": {
                                        "_count": "desc"
                                    },
                                    "size": 7
                                }
                            }
                        }
                    }
                },
                "size": 0,
                "fields": [
                    {
                        "field": "created_at",
                        "format": "date_time"
                    },
                    {
                        "field": "updated_at",
                        "format": "date_time"
                    }
                ],
                "script_fields": {},
                "stored_fields": [
                    "*"
                ],
                "runtime_mappings": {},
                "_source": {
                    "excludes": []
                },
                "query": {
                    "bool": {
                        "must": [],
                        "filter": [
                            {
                                "range": {
                                    "created_at": {
                                        "format": "strict_date_optional_time",
                                        "gte": dateFrom,
                                        "lte": dateTo
                                    }
                                }
                            }
                        ],
                        "should": [],
                        "must_not": []
                    }
                }
            };

            let resPeriodUsersBody = await client
                .search({
                    index: 'candyuser_auth_log',
                    body: choparPeriodUsersBody
                });


            choparPeriodUsers = resPeriodUsersBody.body.aggregations[0].buckets;

            let resLesPeriodUsersBody = await client
                .search({
                    index: 'lesuser_auth_log',
                    body: choparPeriodUsersBody
                });

            lesPeriodUsers = resLesPeriodUsersBody.body.aggregations[0].buckets;


            let choparTotalPeriodOrderUsersBody = {
                "aggs": {
                    "0": {
                        "terms": {
                            "field": "sourceType",
                            "order": {
                                "1": "desc"
                            },
                            "size": 8
                        },
                        "aggs": {
                            "1": {
                                "cardinality": {
                                    "field": "user_id"
                                }
                            }
                        }
                    }
                },
                "size": 0,
                "fields": [
                    {
                        "field": "created_at",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_cookingStartTime",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenBillPrinted",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenClosed",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenConfirmed",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenCreated",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenDelivered",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenPrinted",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenSended",
                        "format": "date_time"
                    },
                    {
                        "field": "updated_at",
                        "format": "date_time"
                    },
                    {
                        "field": "user.created_at",
                        "format": "date_time"
                    }
                ],
                "script_fields": {
                    "testCookingTime": {
                        "script": {
                            "source": "if (doc['iiko_cookingStartTime'].size() == 0) return null;\r\nif (doc['iiko_whenBillPrinted'].size() == 0) return null;\r\ndef cookingStartTime = doc[\"iiko_cookingStartTime\"].value;\r\ndef whenPrinted = doc[\"iiko_whenBillPrinted\"].value;\r\n\r\nif (cookingStartTime != null) {\r\n    def difference = (whenPrinted.toEpochMilli()-cookingStartTime.toEpochMilli());\r\n    return difference/1000;\r\n}",
                            "lang": "painless"
                        }
                    }
                },
                "stored_fields": [
                    "*"
                ],
                "runtime_mappings": {},
                "_source": {
                    "excludes": []
                },
                "query": {
                    "bool": {
                        "must": [],
                        "filter": [
                            {
                                "range": {
                                    "created_at": {
                                        "format": "strict_date_optional_time",
                                        "gte": dateFrom,
                                        "lte": dateTo
                                    }
                                }
                            }
                        ],
                        "should": [],
                        "must_not": []
                    }
                }
            };

            let chopTotalPeriodOrderUsersRes = await client
                .search({
                    index: 'candy_orders',
                    body: choparTotalPeriodOrderUsersBody
                });
            choparTotalPeriodOrderUsers = chopTotalPeriodOrderUsersRes.body.aggregations[0].buckets;
            let lesTotalPeriodOrderUsersRes = await client
                .search({
                    index: 'les_orders',
                    body: choparTotalPeriodOrderUsersBody
                });
            lesTotalPeriodOrderUsers = lesTotalPeriodOrderUsersRes.body.aggregations[0].buckets;

            let monthDateFrom = DateTime.fromMillis(choparPeriodResult[0].key, {zone: 'Asia/Tashkent'}).startOf('month').toFormat("yyyy-MM-dd'T'") + '00:00:00.000Z'
            let monthDateTo = DateTime.fromMillis(choparPeriodResult[0].key, {zone: 'Asia/Tashkent'}).endOf('month').toFormat("yyyy-MM-dd'T'") + '23:59:59.000Z'
            let choparMonthBody = {
                "aggs": {
                    "0": {
                        "terms": {
                            "field": "sourceType",
                            "order": {
                                "_count": "desc"
                            },
                            "size": 5
                        }
                    }
                },
                "size": 0,
                "fields": [
                    {
                        "field": "created_at",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_cookingStartTime",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenBillPrinted",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenClosed",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenConfirmed",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenCreated",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenDelivered",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenPrinted",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenSended",
                        "format": "date_time"
                    },
                    {
                        "field": "updated_at",
                        "format": "date_time"
                    },
                    {
                        "field": "user.created_at",
                        "format": "date_time"
                    }
                ],
                "script_fields": {
                    "testCookingTime": {
                        "script": {
                            "source": "if (doc['iiko_cookingStartTime'].size() == 0) return null;\r\nif (doc['iiko_whenBillPrinted'].size() == 0) return null;\r\ndef cookingStartTime = doc[\"iiko_cookingStartTime\"].value;\r\ndef whenPrinted = doc[\"iiko_whenBillPrinted\"].value;\r\n\r\nif (cookingStartTime != null) {\r\n    def difference = (whenPrinted.toEpochMilli()-cookingStartTime.toEpochMilli());\r\n    return difference/1000;\r\n}",
                            "lang": "painless"
                        }
                    }
                },
                "stored_fields": [
                    "*"
                ],
                "runtime_mappings": {},
                "_source": {
                    "excludes": []
                },
                "query": {
                    "bool": {
                        "must": [],
                        "filter": [
                            {
                                "range": {
                                    "created_at": {
                                        "format": "strict_date_optional_time",
                                        "gte": monthDateFrom,
                                        "lte": monthDateTo
                                    }
                                }
                            }
                        ],
                        "should": [],
                        "must_not": [
                            {
                                "bool": {
                                    "should": [
                                        {
                                            "match_phrase": {
                                                "status": "cancelled"
                                            }
                                        },
                                        {
                                            "match_phrase": {
                                                "status": "not-accepted"
                                            }
                                        },
                                        {
                                            "match_phrase": {
                                                "status": "not-confirmed"
                                            }
                                        },
                                        {
                                            "match_phrase": {
                                                "status": "awaiting-payment"
                                            }
                                        }
                                    ],
                                    "minimum_should_match": 1
                                }
                            }
                        ]
                    }
                }
            };


            res = await client
                .search({
                    index: 'candy_orders',
                    body: choparMonthBody
                });
            choparMonthResult = res.body.aggregations[0].buckets;

            // result = [...res.body.hits.hits.map(hit => ({
            //   id: hit._id,
            //   ...hit._source
            // }))];
            // res = await client
            //   .search({
            //     index: 'les_orders',
            //     body
            //   });
            //
            // result = [...result, ...res.body.hits.hits.map(hit => ({
            //   id: hit._id,
            //   ...hit._source
            // }))];


            res = await client
                .search({
                    index: 'les_orders',
                    body
                });
            // console.log(res.body.aggregations[0]);
            lesPeriodResult = res.body.aggregations[0].buckets;
            res = await client
                .search({
                    index: 'les_orders',
                    body: choparMonthBody
                });
            lesMonthResult = res.body.aggregations[0].buckets;

            return {
                choparPeriodResult,
                choparMonthResult,
                lesPeriodResult,
                lesMonthResult,
                choparPeriodOrderUsers,
                lesPeriodOrderUsers,
                choparPeriodUsers,
                lesPeriodUsers,
                choparTotalPeriodOrderUsers,
                lesTotalPeriodOrderUsers
            }
        } catch (err) {
            return {
                choparPeriodResult,
                choparMonthResult,
                lesPeriodResult,
                lesMonthResult,
                choparPeriodOrderUsers,
                lesPeriodOrderUsers,
                choparPeriodUsers,
                lesPeriodUsers,
                choparTotalPeriodOrderUsers,
                lesTotalPeriodOrderUsers
            }

        }
    }

    @ApiOperation({description: 'Cashback report'})
    @ApiOkResponse({description: 'Successfully printed Cashback'})
    @ApiUnauthorizedResponse({description: 'Invalid credentials'})
    @ApiInternalServerErrorResponse({description: 'Server error'})
    @Permissions('report.paysystems')
    @Get('callcenter/terminals_list')
    async getTerminalsList() {
        let choparTeminals = [];
        let lesTerminals = [];

        const client = new Client({
            node: 'https://localhost:9200',
            auth: {
                username: OrdersController.elasticUser,
                password: OrdersController.elasticPassword
            },
            caFingerprint: "E0:2B:03:49:5C:B4:E6:ED:DE:D8:5C:24:ED:60:3E:9F:7B:9E:B7:49:28:04:BD:6C:8E:6F:14:B0:B4:BA:D2:C0",
            ssl: {
                rejectUnauthorized: false
            }
        });
        let body = {
            sort: {
                active: {
                    order: 'desc'
                }
            },
            size: 500
        };

        let res = await client
            .search({
                index: 'candyterminals',
                body
            });
        choparTeminals = [...res.body.hits.hits.map(hit => ({
            id: hit._id,
            ...hit._source
        }))];
        res = await client
            .search({
                index: 'lesterminals',
                body
            });

        lesTerminals = [...res.body.hits.hits.map(hit => ({
            id: hit._id,
            ...hit._source
        }))];
        return {
            lesTerminals,
            choparTeminals
        };
    }

    @ApiOperation({description: 'Cashback report'})
    @ApiOkResponse({description: 'Successfully printed Cashback'})
    @ApiUnauthorizedResponse({description: 'Invalid credentials'})
    @ApiInternalServerErrorResponse({description: 'Server error'})
    @Permissions('report.paysystems')
    @Post('callcenter/toggle_terminal')
    async toggleTerminal(@Body() ReportPeriod: TerminalToggleOperatorRequestDto, @CurrentUser() user: UserEntity,) {
        const client = new Client({
            node: 'https://localhost:9200',
            auth: {
                username: OrdersController.elasticUser,
                password: OrdersController.elasticPassword
            },
            caFingerprint: "E0:2B:03:49:5C:B4:E6:ED:DE:D8:5C:24:ED:60:3E:9F:7B:9E:B7:49:28:04:BD:6C:8E:6F:14:B0:B4:BA:D2:C0",
            ssl: {
                rejectUnauthorized: false
            }
        });

        let terminalIndex = 'candyterminals';
        if (ReportPeriod.project == 'les') {
            terminalIndex = 'lesterminals';
        }

        await client.update({
            index: terminalIndex,
            id: ReportPeriod.id,
            body: {
                doc: {
                    active: ReportPeriod.active
                }
            }
        });
        return true;
    };

    @ApiOperation({description: 'Cashback report'})
    @ApiOkResponse({description: 'Successfully printed Cashback'})
    @ApiUnauthorizedResponse({description: 'Invalid credentials'})
    @ApiInternalServerErrorResponse({description: 'Server error'})
    @Permissions('report.paysystems')
    @Get('callcenter/reviews_report')
    async getReviewsReport(@Query() ReportPeriod: ReportPeriodRequestDto, @CurrentUser() user: UserEntity,) {
        let dateFrom = ReportPeriod.dateFrom;
        let dateTo = ReportPeriod.dateTo;
        const client = new Client({
            node: 'https://localhost:9200',
            auth: {
                username: OrdersController.elasticUser,
                password: OrdersController.elasticPassword
            },
            caFingerprint: "E0:2B:03:49:5C:B4:E6:ED:DE:D8:5C:24:ED:60:3E:9F:7B:9E:B7:49:28:04:BD:6C:8E:6F:14:B0:B4:BA:D2:C0",
            ssl: {
                rejectUnauthorized: false
            }
        });

        let tashkentReviews = {};
        let tashkentServiceReviews = {};
        let tashkentCourierReviews = {};
        let tashkentTotalReviewsCount = {};
        let regionReviews = {};
        let terminalReports = [];

        let tashkentReviewBody = {
            "aggs": {
                "0": {
                    "terms": {
                        "field": "terminal_name",
                        "order": {
                            "2": "desc"
                        },
                        "size": 60
                    },
                    "aggs": {
                        "1": {
                            "terms": {
                                "field": "iiko_id",
                                "order": {
                                    "2": "desc"
                                },
                                "size": 3
                            },
                            "aggs": {
                                "2": {
                                    "avg": {
                                        "field": "product"
                                    }
                                },
                                "3": {
                                    "avg": {
                                        "field": "service"
                                    }
                                },
                                "4": {
                                    "avg": {
                                        "field": "courier"
                                    }
                                }
                            }
                        },
                        "2": {
                            "avg": {
                                "field": "product"
                            }
                        }
                    }
                }
            },
            "size": 0,
            "fields": [
                {
                    "field": "created_at",
                    "format": "date_time"
                }
            ],
            "script_fields": {},
            "stored_fields": [
                "*"
            ],
            "runtime_mappings": {},
            "_source": {
                "excludes": []
            },
            "query": {
                "bool": {
                    "must": [],
                    "filter": [
                        {
                            "bool": {
                                "should": [
                                    {
                                        "match_phrase": {
                                            "iiko_id": ReportPeriod.terminal
                                        }
                                    }
                                ],
                                "minimum_should_match": 1
                            }
                        },
                        {
                            "bool": {
                                "should": [
                                    {
                                        "match_phrase": {
                                            "city_slug": "tashkent"
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
                        }
                    ],
                    "should": [],
                    "must_not": []
                }
            }
        };
        let regionReviewBody = {
            "aggs": {
                "0": {
                    "terms": {
                        "field": "terminal_name",
                        "order": {
                            "2": "desc"
                        },
                        "size": 60
                    },
                    "aggs": {
                        "1": {
                            "terms": {
                                "field": "iiko_id",
                                "order": {
                                    "2": "desc"
                                },
                                "size": 3
                            },
                            "aggs": {
                                "2": {
                                    "avg": {
                                        "field": "product"
                                    }
                                },
                                "3": {
                                    "avg": {
                                        "field": "service"
                                    }
                                },
                                "4": {
                                    "avg": {
                                        "field": "courier"
                                    }
                                }
                            }
                        },
                        "2": {
                            "avg": {
                                "field": "product"
                            }
                        }
                    }
                }
            },
            "size": 0,
            "fields": [
                {
                    "field": "created_at",
                    "format": "date_time"
                }
            ],
            "script_fields": {},
            "stored_fields": [
                "*"
            ],
            "runtime_mappings": {},
            "_source": {
                "excludes": []
            },
            "query": {
                "bool": {
                    "must": [],
                    "filter": [
                        {
                            "bool": {
                                "should": [
                                    {
                                        "match_phrase": {
                                            "iiko_id": ReportPeriod.terminal
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
                        }
                    ],
                    "should": [],
                    "must_not": [
                        {
                            "bool": {
                                "should": [
                                    {
                                        "match_phrase": {
                                            "city_slug": "tashkent"
                                        }
                                    }
                                ],
                                "minimum_should_match": 1
                            }
                        }
                    ]
                }
            }
        };

        if (!ReportPeriod.terminal) {
            tashkentReviewBody.query.bool.filter = tashkentReviewBody.query.bool.filter.filter((element, index) => index > 0)
            regionReviewBody.query.bool.filter = regionReviewBody.query.bool.filter.filter((element, index) => index > 0)
        }
        console.log(JSON.stringify(tashkentReviewBody.query.bool.filter))
        let res = await client
            .search({
                index: 'reviews',
                body: tashkentReviewBody
            });

        res.body.aggregations[0].buckets.map(item => {
            let terminalId = item[1]['buckets'][0]['key'];

            tashkentReviews[terminalId] = {
                'terminalName': item.key,
                terminalId,
                productCount: item[1]['buckets'][0][2]['value'] ? +item[1]['buckets'][0][2]['value'].toFixed(2) : 0,
                serviceCount: item[1]['buckets'][0][3]['value'] ? +item[1]['buckets'][0][3]['value'].toFixed(2) : 0,
                courierCount: item[1]['buckets'][0][4]['value'] ? +item[1]['buckets'][0][4]['value'].toFixed(2) : 0,
                reviewsCount: item.doc_count
            }
        });


        res = await client
            .search({
                index: 'reviews',
                body: regionReviewBody
            });

        res.body.aggregations[0].buckets.map(item => {
            let terminalId = item[1]['buckets'][0]['key'];

            regionReviews[terminalId] = {
                'terminalName': item.key,
                terminalId,
                productCount: item[1]['buckets'][0][2]['value'] ? +item[1]['buckets'][0][2]['value'].toFixed(2) : 0,
                serviceCount: item[1]['buckets'][0][3]['value'] ? +item[1]['buckets'][0][3]['value'].toFixed(2) : 0,
                courierCount: item[1]['buckets'][0][4]['value'] ? +item[1]['buckets'][0][4]['value'].toFixed(2) : 0,
                reviewsCount: item.doc_count
            }
        });


        let choparTashkentOrdersBody = {
            "aggs": {
                "0": {
                    "terms": {
                        "field": "terminalData.iiko_id",
                        "order": {
                            "_count": "desc"
                        },
                        "size": 80
                    }
                }
            },
            "size": 0,
            "fields": [
                {
                    "field": "created_at",
                    "format": "date_time"
                },
                {
                    "field": "iiko_cookingStartTime",
                    "format": "date_time"
                },
                {
                    "field": "iiko_whenBillPrinted",
                    "format": "date_time"
                },
                {
                    "field": "iiko_whenClosed",
                    "format": "date_time"
                },
                {
                    "field": "iiko_whenConfirmed",
                    "format": "date_time"
                },
                {
                    "field": "iiko_whenCreated",
                    "format": "date_time"
                },
                {
                    "field": "iiko_whenDelivered",
                    "format": "date_time"
                },
                {
                    "field": "iiko_whenPrinted",
                    "format": "date_time"
                },
                {
                    "field": "iiko_whenSended",
                    "format": "date_time"
                },
                {
                    "field": "updated_at",
                    "format": "date_time"
                },
                {
                    "field": "user.created_at",
                    "format": "date_time"
                }
            ],
            "script_fields": {
                "testCookingTime": {
                    "script": {
                        "source": "if (doc['iiko_cookingStartTime'].size() == 0) return null;\r\nif (doc['iiko_whenBillPrinted'].size() == 0) return null;\r\ndef cookingStartTime = doc[\"iiko_cookingStartTime\"].value;\r\ndef whenPrinted = doc[\"iiko_whenBillPrinted\"].value;\r\n\r\nif (cookingStartTime != null) {\r\n    def difference = (whenPrinted.toEpochMilli()-cookingStartTime.toEpochMilli());\r\n    return difference/1000;\r\n}",
                        "lang": "painless"
                    }
                }
            },
            "stored_fields": [
                "*"
            ],
            "runtime_mappings": {},
            "_source": {
                "excludes": []
            },
            "query": {
                "bool": {
                    "must": [],
                    "filter": [
                        {
                            "bool": {
                                "should": [
                                    {
                                        "match_phrase": {
                                            "terminalData.iiko_id": ReportPeriod.terminal
                                        }
                                    }
                                ],
                                "minimum_should_match": 1
                            }
                        },
                        {
                            "bool": {
                                "should": [
                                    {
                                        "match_phrase": {
                                            "terminalData.city_slug": "tashkent"
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
                        }
                    ],
                    "should": [],
                    "must_not": []
                }
            }
        };


        if (!ReportPeriod.terminal) {
            choparTashkentOrdersBody.query.bool.filter = choparTashkentOrdersBody.query.bool.filter.filter((element, index) => index > 0)
        }

        Object.keys(tashkentReviews).map(key => {
            tashkentReviews[key].ordersCount = 0;
        });


        Object.keys(regionReviews).map(key => {
            regionReviews[key].ordersCount = 0;
        });

        res = await client
            .search({
                index: 'candy_orders',
                body: choparTashkentOrdersBody
            });

        res.body.aggregations[0].buckets.map(item => {
            if (tashkentReviews[item.key]) {
                tashkentReviews[item.key].ordersCount = item.doc_count;
            }
        });

        res = await client
            .search({
                index: 'les_orders',
                body: choparTashkentOrdersBody
            });

        res.body.aggregations[0].buckets.map(item => {
            if (tashkentReviews[item.key]) {
                tashkentReviews[item.key].ordersCount = item.doc_count;
            }
        });


        let choparRegionOrdersBody = {
            "aggs": {
                "0": {
                    "terms": {
                        "field": "terminalData.iiko_id",
                        "order": {
                            "_count": "desc"
                        },
                        "size": 80
                    }
                }
            },
            "size": 0,
            "fields": [
                {
                    "field": "created_at",
                    "format": "date_time"
                },
                {
                    "field": "iiko_cookingStartTime",
                    "format": "date_time"
                },
                {
                    "field": "iiko_whenBillPrinted",
                    "format": "date_time"
                },
                {
                    "field": "iiko_whenClosed",
                    "format": "date_time"
                },
                {
                    "field": "iiko_whenConfirmed",
                    "format": "date_time"
                },
                {
                    "field": "iiko_whenCreated",
                    "format": "date_time"
                },
                {
                    "field": "iiko_whenDelivered",
                    "format": "date_time"
                },
                {
                    "field": "iiko_whenPrinted",
                    "format": "date_time"
                },
                {
                    "field": "iiko_whenSended",
                    "format": "date_time"
                },
                {
                    "field": "updated_at",
                    "format": "date_time"
                },
                {
                    "field": "user.created_at",
                    "format": "date_time"
                }
            ],
            "script_fields": {
                "testCookingTime": {
                    "script": {
                        "source": "if (doc['iiko_cookingStartTime'].size() == 0) return null;\r\nif (doc['iiko_whenBillPrinted'].size() == 0) return null;\r\ndef cookingStartTime = doc[\"iiko_cookingStartTime\"].value;\r\ndef whenPrinted = doc[\"iiko_whenBillPrinted\"].value;\r\n\r\nif (cookingStartTime != null) {\r\n    def difference = (whenPrinted.toEpochMilli()-cookingStartTime.toEpochMilli());\r\n    return difference/1000;\r\n}",
                        "lang": "painless"
                    }
                }
            },
            "stored_fields": [
                "*"
            ],
            "runtime_mappings": {},
            "_source": {
                "excludes": []
            },
            "query": {
                "bool": {
                    "must": [],
                    "filter": [
                        {
                            "bool": {
                                "should": [
                                    {
                                        "match_phrase": {
                                            "terminalData.iiko_id": ReportPeriod.terminal
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
                        }
                    ],
                    "should": [],
                    "must_not": [
                        {
                            "bool": {
                                "should": [
                                    {
                                        "match_phrase": {
                                            "city_slug": "tashkent"
                                        }
                                    }
                                ],
                                "minimum_should_match": 1
                            }
                        }
                    ]
                }
            }
        };

        if (!ReportPeriod.terminal) {
            choparRegionOrdersBody.query.bool.filter = choparRegionOrdersBody.query.bool.filter.filter((element, index) => index > 0)
        }

        res = await client
            .search({
                index: 'candy_orders',
                body: choparRegionOrdersBody
            });

        res.body.aggregations[0].buckets.map(item => {
            if (regionReviews[item.key]) {
                regionReviews[item.key].ordersCount = item.doc_count;
            }
        });

        res = await client
            .search({
                index: 'les_orders',
                body: choparRegionOrdersBody
            });

        res.body.aggregations[0].buckets.map(item => {
            if (regionReviews[item.key]) {
                regionReviews[item.key].ordersCount = item.doc_count;
            }
        });


        if (ReportPeriod.terminal) {
            let terminalReviewsBody = {
                "aggs": {
                    "0": {
                        "date_histogram": {
                            "field": "created_at",
                            "calendar_interval": "1d",
                            "time_zone": "Asia/Tashkent"
                        },
                        "aggs": {
                            "1": {
                                "avg": {
                                    "field": "product"
                                }
                            },
                            "2": {
                                "avg": {
                                    "field": "service"
                                }
                            },
                            "3": {
                                "avg": {
                                    "field": "courier"
                                }
                            }
                        }
                    }
                },
                "size": 0,
                "fields": [
                    {
                        "field": "created_at",
                        "format": "date_time"
                    }
                ],
                "script_fields": {},
                "stored_fields": [
                    "*"
                ],
                "runtime_mappings": {},
                "_source": {
                    "excludes": []
                },
                "query": {
                    "bool": {
                        "must": [],
                        "filter": [
                            {
                                "bool": {
                                    "should": [
                                        {
                                            "match_phrase": {
                                                "iiko_id": ReportPeriod.terminal
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
                            }
                        ],
                        "should": [],
                        "must_not": []
                    }
                }
            };
            res = await client
                .search({
                    index: 'reviews',
                    body: terminalReviewsBody
                });
            terminalReports = res.body.aggregations[0].buckets;

        }
        return {
            tashkentReviews: Object.values(tashkentReviews),
            regionReviews: Object.values(regionReviews),
            choparOrders: res,
            terminalReviews: terminalReports
        };
    }

    @ApiOperation({description: 'Cashback report'})
    @ApiOkResponse({description: 'Successfully printed Cashback'})
    @ApiUnauthorizedResponse({description: 'Invalid credentials'})
    @ApiInternalServerErrorResponse({description: 'Server error'})
    @Permissions('report.paysystems')
    @Get('callcenter/orders_timeline')
    async getCallCenterOrdersTimeline(@Query() ReportPeriod: ReportPeriodRequestDto, @CurrentUser() user: UserEntity,) {
        let dateFrom = DateTime.fromMillis(+ReportPeriod.dateFrom, {zone: 'Asia/Tashkent'}).toFormat("yyyy-MM-dd'T'") + '00:00:00.000Z'
        let dateTo = DateTime.fromMillis(+ReportPeriod.dateTo, {zone: 'Asia/Tashkent'}).toFormat("yyyy-MM-dd'T'") + '23:59:59.000Z'


        const client = new Client({
            node: 'https://localhost:9200',
            auth: {
                username: OrdersController.elasticUser,
                password: OrdersController.elasticPassword
            },
            caFingerprint: "E0:2B:03:49:5C:B4:E6:ED:DE:D8:5C:24:ED:60:3E:9F:7B:9E:B7:49:28:04:BD:6C:8E:6F:14:B0:B4:BA:D2:C0",
            ssl: {
                rejectUnauthorized: false
            }
        });
        let choparDeliveryOrders = {};
        try {
            let body = {
                "sort": [
                    {
                        "created_at": {
                            "order": "desc",
                            "unmapped_type": "boolean"
                        }
                    }
                ],
                // scroll: '30s',
                // size: 1000,
                fields: [
                    {
                        "field": "created_at",
                        "format": "epoch_millis"
                    },
                    "took_id",
                    "terminalData.name"
                ],
                "_source": false,
                "query": {
                    "bool": {
                        "must": [],
                        "filter": [
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
                                "match_phrase": {
                                    "delivery_type": "deliver"
                                }
                            },
                            {
                                "exists": {
                                    "field": "took_id"
                                }
                            }
                        ],
                        "should": [],
                        "must_not": []
                    }
                }
            };

            async function* scrollSearch(params) {
                let response: any = await client.search(params);
                while (true) {
                    const sourceHits = response.body.hits.hits;
                    if (sourceHits.length === 0) {
                        break
                    }

                    for (const hit of sourceHits) {
                        yield hit
                    }

                    if (!response.body._scroll_id) {
                        break
                    }

                    response = await client.scroll({
                        scroll_id: response.body._scroll_id,
                        scroll: params.scroll
                    })
                }
            }


            for await (const hit of scrollSearch({
                index: 'candy_orders',
                scroll: '60s',
                size: 10000,
                body
            })) {
                let res = {
                    id: hit._id,
                    took_id: ''
                };

                Object.keys(hit.fields).map(key => {
                    if (key == 'terminalData.name') {
                        res['terminal_name'] = hit.fields[key][0];
                    } else if (key == 'created_at') {
                        res['created_at'] = DateTime.fromMillis(+hit.fields[key][0], {zone: 'Asia/Tashkent'}).toFormat("dd.MM.yyyy HH:mm:ss");
                    } else {
                        res[key] = hit.fields[key][0];
                    }
                });
                choparDeliveryOrders[res.took_id] = res;
            }

            const {data} = await axios.post('https://panel.took.uz/v1/b2b/get-order-dates', {
                dateFrom: ReportPeriod.dateFrom,
                dateTo: ReportPeriod.dateTo
            }, {
                headers: {
                    'Token': '$2y$13$wKAn23NGA65xpkaB.94sDuTXLCMnX8RzjnkqN/lilrXffHH.6zNs6'
                }
            });

            if (data.result) {
                Object.keys(data.result).map(key => {
                    if (choparDeliveryOrders[key]) {
                        choparDeliveryOrders[key] = {
                            ...choparDeliveryOrders[key],
                            ...data.result[key]
                        }
                    }
                });
            }


            return {
                choparDeliveryOrders: Object.values(choparDeliveryOrders)
            }
        } catch (err) {
            console.log(err)
            return {
                choparDeliveryOrders: Object.values(choparDeliveryOrders)
            }

        }
    }

    @ApiOperation({description: 'Cashback report'})
    @ApiOkResponse({description: 'Successfully printed Cashback'})
    @ApiUnauthorizedResponse({description: 'Invalid credentials'})
    @ApiInternalServerErrorResponse({description: 'Server error'})
    @Permissions('report.paysystems')
    @Get('callcenter/orders_count_comparison')
    async getCallCenterOrdersCountComparison(@Query() ReportPeriod: ReportPeriodRequestDto, @CurrentUser() user: UserEntity,) {
        let dateFrom = DateTime.fromMillis(+ReportPeriod.dateFrom, {zone: 'Asia/Tashkent'}).toFormat("yyyy-MM-dd'T'") + '00:00:00.000Z'
        let dateTo = DateTime.fromMillis(+ReportPeriod.dateTo, {zone: 'Asia/Tashkent'}).toFormat("yyyy-MM-dd'T'") + '23:59:59.000Z'


        const client = new Client({
            node: 'https://localhost:9200',
            auth: {
                username: OrdersController.elasticUser,
                password: OrdersController.elasticPassword
            },
            caFingerprint: "E0:2B:03:49:5C:B4:E6:ED:DE:D8:5C:24:ED:60:3E:9F:7B:9E:B7:49:28:04:BD:6C:8E:6F:14:B0:B4:BA:D2:C0",
            ssl: {
                rejectUnauthorized: false
            }
        });
        let choparDeliveryOrders = {};
        try {
            let body = {
                "aggs": {
                    "0": {
                        "date_histogram": {
                            "field": "created_at",
                            "calendar_interval": "1d",
                            "time_zone": "Asia/Tashkent"
                        }
                    }
                },
                "size": 0,
                "fields": [
                    {
                        "field": "created_at",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_cookingStartTime",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenBillPrinted",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenClosed",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenConfirmed",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenCreated",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenDelivered",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenPrinted",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenSended",
                        "format": "date_time"
                    },
                    {
                        "field": "updated_at",
                        "format": "date_time"
                    },
                    {
                        "field": "user.created_at",
                        "format": "date_time"
                    }
                ],
                "script_fields": {},
                "stored_fields": [
                    "*"
                ],
                "runtime_mappings": {},
                "_source": {
                    "excludes": []
                },
                "query": {
                    "bool": {
                        "must": [],
                        "filter": [
                            {
                                "match_phrase": {
                                    "delivery_type": "deliver"
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
                            }
                        ],
                        "should": [],
                        "must_not": [
                            {
                                "bool": {
                                    "should": [
                                        {
                                            "match_phrase": {
                                                "status": "accepted"
                                            }
                                        },
                                        {
                                            "match_phrase": {
                                                "status": "awaiting-payment"
                                            }
                                        },
                                        {
                                            "match_phrase": {
                                                "status": "cancelled"
                                            }
                                        },
                                        {
                                            "match_phrase": {
                                                "status": "not-accepted"
                                            }
                                        },
                                        {
                                            "match_phrase": {
                                                "status": "not-confirmed"
                                            }
                                        }
                                    ],
                                    "minimum_should_match": 1
                                }
                            }
                        ]
                    }
                }
            };
            let res = await client
                .search({
                    index: 'candy_orders',
                    body
                });

            // res.body.aggregations[0].

            res.body.aggregations[0].buckets.map(item => {
                choparDeliveryOrders[item.key] = {
                    orders_count: item.doc_count,
                    date: item.key
                }
            })

            const {data} = await axios.post('https://panel.took.uz/v1/b2b/get-order-counts', {
                dateFrom: ReportPeriod.dateFrom,
                dateTo: ReportPeriod.dateTo
            }, {
                headers: {
                    'Token': '$2y$13$wKAn23NGA65xpkaB.94sDuTXLCMnX8RzjnkqN/lilrXffHH.6zNs6'
                }
            });

            if (data.result) {
                data.result.map((item:any) => {
                    if (choparDeliveryOrders[item.date]) {
                        choparDeliveryOrders[item.date].took_count = item.cnt;
                    }
                });
            }


            return {
                choparDeliveryOrders: Object.values(choparDeliveryOrders)
            }
        } catch (err) {
            console.log(err)
            return {
                choparDeliveryOrders: Object.values(choparDeliveryOrders)
            }

        }
    }

    @ApiOperation({description: 'Cashback report'})
    @ApiOkResponse({description: 'Successfully printed Cashback'})
    @ApiUnauthorizedResponse({description: 'Invalid credentials'})
    @ApiInternalServerErrorResponse({description: 'Server error'})
    @Permissions('report.paysystems')
    @Get('callcenter/les_orders_count_comparison')
    async getCallCenterLesOrdersCountComparison(@Query() ReportPeriod: ReportPeriodRequestDto, @CurrentUser() user: UserEntity,) {
        let dateFrom = DateTime.fromMillis(+ReportPeriod.dateFrom, {zone: 'Asia/Tashkent'}).toFormat("yyyy-MM-dd'T'") + '00:00:00.000Z'
        let dateTo = DateTime.fromMillis(+ReportPeriod.dateTo, {zone: 'Asia/Tashkent'}).toFormat("yyyy-MM-dd'T'") + '23:59:59.000Z'


        const client = new Client({
            node: 'https://localhost:9200',
            auth: {
                username: OrdersController.elasticUser,
                password: OrdersController.elasticPassword
            },
            caFingerprint: "E0:2B:03:49:5C:B4:E6:ED:DE:D8:5C:24:ED:60:3E:9F:7B:9E:B7:49:28:04:BD:6C:8E:6F:14:B0:B4:BA:D2:C0",
            ssl: {
                rejectUnauthorized: false
            }
        });
        let choparDeliveryOrders = {};
        try {
            let body = {
                "aggs": {
                    "0": {
                        "date_histogram": {
                            "field": "created_at",
                            "calendar_interval": "1d",
                            "time_zone": "Asia/Tashkent"
                        }
                    }
                },
                "size": 0,
                "fields": [
                    {
                        "field": "created_at",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_cookingStartTime",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenBillPrinted",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenClosed",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenConfirmed",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenCreated",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenDelivered",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenPrinted",
                        "format": "date_time"
                    },
                    {
                        "field": "iiko_whenSended",
                        "format": "date_time"
                    },
                    {
                        "field": "updated_at",
                        "format": "date_time"
                    },
                    {
                        "field": "user.created_at",
                        "format": "date_time"
                    }
                ],
                "script_fields": {},
                "stored_fields": [
                    "*"
                ],
                "runtime_mappings": {},
                "_source": {
                    "excludes": []
                },
                "query": {
                    "bool": {
                        "must": [],
                        "filter": [
                            {
                                "match_phrase": {
                                    "delivery_type": "deliver"
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
                            }
                        ],
                        "should": [],
                        "must_not": [
                            {
                                "bool": {
                                    "should": [
                                        {
                                            "match_phrase": {
                                                "status": "accepted"
                                            }
                                        },
                                        {
                                            "match_phrase": {
                                                "status": "awaiting-payment"
                                            }
                                        },
                                        {
                                            "match_phrase": {
                                                "status": "cancelled"
                                            }
                                        },
                                        {
                                            "match_phrase": {
                                                "status": "not-accepted"
                                            }
                                        },
                                        {
                                            "match_phrase": {
                                                "status": "not-confirmed"
                                            }
                                        }
                                    ],
                                    "minimum_should_match": 1
                                }
                            }
                        ]
                    }
                }
            };
            let res = await client
                .search({
                    index: 'les_orders',
                    body
                });

            // res.body.aggregations[0].

            res.body.aggregations[0].buckets.map(item => {
                choparDeliveryOrders[item.key] = {
                    orders_count: item.doc_count,
                    date: item.key
                }
            })

            const {data} = await axios.post('https://panel.took.uz/v1/b2b/get-order-counts', {
                dateFrom: ReportPeriod.dateFrom,
                dateTo: ReportPeriod.dateTo
            }, {
                headers: {
                    'Token': '$2y$13$pWhPpuDZCZ8IqxkbwuKwwOyac.ctCq3OXGzwBOdNoOEhMtG4aUZ96'
                }
            });

            if (data.result) {
                data.result.map((item:any) => {
                    if (choparDeliveryOrders[item.date]) {
                        choparDeliveryOrders[item.date].took_count = item.cnt;
                    }
                });
            }


            return {
                choparDeliveryOrders: Object.values(choparDeliveryOrders)
            }
        } catch (err) {
            console.log(err)
            return {
                choparDeliveryOrders: Object.values(choparDeliveryOrders)
            }

        }
    }


    @ApiOperation({description: 'Cashback report'})
    @ApiOkResponse({description: 'Successfully printed Cashback'})
    @ApiUnauthorizedResponse({description: 'Invalid credentials'})
    @ApiInternalServerErrorResponse({description: 'Server error'})
    @Permissions('report.paysystems')
    @Get('callcenter/les_orders_timeline')
    async getCallCenterLesOrdersTimeline(@Query() ReportPeriod: ReportPeriodRequestDto, @CurrentUser() user: UserEntity,) {
        let dateFrom = DateTime.fromMillis(+ReportPeriod.dateFrom, {zone: 'Asia/Tashkent'}).toFormat("yyyy-MM-dd'T'") + '00:00:00.000Z'
        let dateTo = DateTime.fromMillis(+ReportPeriod.dateTo, {zone: 'Asia/Tashkent'}).toFormat("yyyy-MM-dd'T'") + '23:59:59.000Z'


        const client = new Client({
            node: 'https://localhost:9200',
            auth: {
                username: OrdersController.elasticUser,
                password: OrdersController.elasticPassword
            },
            caFingerprint: "E0:2B:03:49:5C:B4:E6:ED:DE:D8:5C:24:ED:60:3E:9F:7B:9E:B7:49:28:04:BD:6C:8E:6F:14:B0:B4:BA:D2:C0",
            ssl: {
                rejectUnauthorized: false
            }
        });
        let choparDeliveryOrders = {};
        try {
            let body = {
                "sort": [
                    {
                        "created_at": {
                            "order": "desc",
                            "unmapped_type": "boolean"
                        }
                    }
                ],
                fields: [
                    {
                        "field": "created_at",
                        "format": "epoch_millis"
                    },
                    "took_id",
                    "terminalData.name"
                ],
                "_source": false,
                "query": {
                    "bool": {
                        "must": [],
                        "filter": [
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
                                "match_phrase": {
                                    "delivery_type": "deliver"
                                }
                            },
                            {
                                "exists": {
                                    "field": "took_id"
                                }
                            }
                        ],
                        "should": [],
                        "must_not": []
                    }
                }
            };

            async function* scrollSearch(params) {
                let response: any = await client.search(params);

                while (true) {
                    const sourceHits = response.body.hits.hits;
                    if (sourceHits.length === 0) {
                        break
                    }

                    for (const hit of sourceHits) {
                        yield hit
                    }

                    if (!response.body._scroll_id) {
                        break
                    }

                    response = await client.scroll({
                        scroll_id: response.body._scroll_id,
                        scroll: params.scroll
                    })
                }
            }

            // let res = await client
            //     .search({
            //       index: 'candy_orders',
            //       body
            //     });


            for await (const hit of scrollSearch({
                index: 'les_orders',
                scroll: '60s',
                size: 1000,
                body
            })) {
                let res = {
                    id: hit._id,
                    took_id: ''
                };

                Object.keys(hit.fields).map(key => {
                    if (key == 'terminalData.name') {
                        res['terminal_name'] = hit.fields[key][0];
                    } else if (key == 'created_at') {
                        res['created_at'] = DateTime.fromMillis(+hit.fields[key][0], {zone: 'Asia/Tashkent'}).toFormat("dd.MM.yyyy HH:mm:ss");
                    } else {
                        res[key] = hit.fields[key][0];
                    }
                });
                choparDeliveryOrders[res.took_id] = res;
            }

            const {data} = await axios.post('https://panel.took.uz/v1/b2b/get-order-dates', {
                dateFrom: ReportPeriod.dateFrom,
                dateTo: ReportPeriod.dateTo
            }, {
                headers: {
                    'Token': '$2y$13$pWhPpuDZCZ8IqxkbwuKwwOyac.ctCq3OXGzwBOdNoOEhMtG4aUZ96'
                }
            });


            if (data.result) {
                Object.keys(data.result).map(key => {
                    if (choparDeliveryOrders[key]) {
                        choparDeliveryOrders[key] = {
                            ...choparDeliveryOrders[key],
                            ...data.result[key]
                        }
                    }
                });
            }


            return {
                choparDeliveryOrders: Object.values(choparDeliveryOrders)
            }
        } catch (err) {
            console.log(err)
            return {
                choparDeliveryOrders: Object.values(choparDeliveryOrders)
            }

        }
    }

}
