import {Body, Controller, Get, Post, ValidationPipe} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {ApiInternalServerErrorResponse, ApiOkResponse, ApiOperation, ApiUnauthorizedResponse} from '@nestjs/swagger';
import {AuthCredentialsRequestDto} from '@modules/auth/dtos';
import {IndexReviewRequestDto} from '@modules/reviews/dtos/index-review-request.dto';
import {SkipAuth} from '@auth';
import {Client} from '@elastic/elasticsearch';
import * as fs from 'fs';

@SkipAuth()
@Controller({
    path: 'reviews',
    version: '1',
})
export class ReviewsController {
    static elasticUser: string;
    static elasticPassword: string;
    static elasticCertFile: string;

    constructor(private configService: ConfigService) {
        ReviewsController.elasticUser = this.configService.get('ELASTIC_USERNAME');
        ReviewsController.elasticPassword = this.configService.get('ELASTIC_PASSWORD');
        ReviewsController.elasticCertFile = this.configService.get('ELASTIC_CERTFILE');
    }

    @ApiOperation({description: 'Terminals list'})
    @ApiOkResponse({description: 'Successfully list of terminals'})
    @ApiUnauthorizedResponse({description: 'Invalid credentials'})
    @ApiInternalServerErrorResponse({description: 'Server error'})
    @Post()
    async indexReview(@Body(ValidationPipe) indexReview: IndexReviewRequestDto) {
        const client = new Client({
            node: 'https://localhost:9200',
            auth: {
                username: ReviewsController.elasticUser,
                password: ReviewsController.elasticPassword,
            },
            caFingerprint: "E0:2B:03:49:5C:B4:E6:ED:DE:D8:5C:24:ED:60:3E:9F:7B:9E:B7:49:28:04:BD:6C:8E:6F:14:B0:B4:BA:D2:C0",
            ssl: {
                rejectUnauthorized: false
            },
        });

        let reviewIndexExists = await client.indices.exists({index: 'reviews'});
        if (!reviewIndexExists.body) {
            await client.indices.create({
                index: 'reviews',
                body: {},
            });
            await client.indices.putSettings({
                index: 'reviews',
                body: {
                    // 'number_of_shards': 2,
                    number_of_replicas: 1,
                },
            });
            await client.indices.putMapping({
                index: 'reviews',
                // type: 'document',
                body: {
                    properties: {
                        created_at: {
                            type: 'date',
                        },
                        terminal_name: {
                            type: 'keyword',
                        },
                        terminal_id: {
                            type: 'integer',
                        },
                        project: {
                            type: 'keyword',
                        },
                        product: {
                            type: 'integer',
                        },
                        service: {
                            type: 'integer',
                        },
                        courier: {
                            type: 'integer',
                        },
                        iiko_id: {
                            type: 'keyword',
                        },
                        city_slug: {
                            type: 'keyword',
                        },
                    },
                },
                // include_type_name: true
            });
        }

        await client.index({
            index: 'reviews',
            id: indexReview.itemId,
            body: indexReview.item,
        });
    }
}
